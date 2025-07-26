# Supabase Setup for Kamai Mobile (Database + Storage, No Auth)

This document explains how to set up Supabase for the Kamai Mobile app using the database and storage features, but **without** the authentication system.

## Prerequisites

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your Project URL and Anon Key from the API settings
3. Update the credentials in `lib/supabase.ts`

## Database Schema

### 1. Create Users Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  name text,
  wallet text unique not null,
  profile_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to update updated_at column
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute procedure public.handle_updated_at();
```

### 2. Create RLS Policies (Permissive for non-auth use)

Since we're not using Supabase Auth, we'll create permissive policies that allow operations based on the public anon key:

```sql
-- Policy: Allow public read access to all profiles
create policy "Allow public read access" on public.users
  for select using (true);

-- Policy: Allow public insert (anyone can create a profile)
create policy "Allow public insert" on public.users
  for insert with check (true);

-- Policy: Allow public update (anyone can update any profile)
-- Note: In production, you might want to add wallet-based restrictions here
create policy "Allow public update" on public.users
  for update using (true) with check (true);

-- Policy: Allow public delete (anyone can delete any profile)
-- Note: Use with caution in production
create policy "Allow public delete" on public.users
  for delete using (true);

-- Add index on wallet for better performance
create index users_wallet_idx on public.users (wallet);
```

### 3. Create Storage Bucket for Profile Images

Run this in the SQL Editor to create a storage bucket:

```sql
-- Create profile-images bucket
insert into storage.buckets (id, name, public) 
values ('profile-images', 'profile-images', true);
```

### 4. Set Storage Policies

```sql
-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Anyone can view profile images
create policy "Anyone can view profile images" on storage.objects
  for select using (bucket_id = 'profile-images');

-- Policy: Anyone can upload profile images (public access)
create policy "Anyone can upload profile images" on storage.objects
  for insert with check (bucket_id = 'profile-images');

-- Policy: Anyone can update profile images
create policy "Anyone can update profile images" on storage.objects
  for update using (bucket_id = 'profile-images');

-- Policy: Anyone can delete profile images
create policy "Anyone can delete profile images" on storage.objects
  for delete using (bucket_id = 'profile-images');

-- Alternative: If you want to disable RLS completely for storage (less secure but simpler)
-- alter table storage.objects disable row level security;
```

## Configuration Steps

### 1. Update Environment Variables

In your `lib/supabase.ts` file, replace the placeholder values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key
```

### 2. Enable Storage in Supabase Dashboard

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `profile-images`
3. Make it public
4. Set the policies as shown above

## Usage

### Personal Information Form

The app includes a Personal Information form that:

1. **Loads existing user data** from the database when opened
2. **Allows image upload** via camera or photo library to Supabase Storage
3. **Saves to Supabase database** with proper wallet linking
4. **Updates profile display** in real-time

### Wallet Integration

- **Wallet address** is automatically captured from the connected wallet
- **Unique constraint** prevents duplicate wallet registrations
- **Profile data** is linked to wallet address for identification

### Security Features

- **Row Level Security** with permissive policies for public access
- **Wallet-based identification** (not authentication)
- **Public storage** for profile images
- **Simple database operations** without auth complexity

## API Usage Examples

### Get User by Wallet
```typescript
const userData = await userService.getUserByWallet(walletAddress);
```

### Create/Update User
```typescript
const userData = await userService.upsertUser({
  name: 'John Doe',
  wallet: walletAddress,
  profile_image: imageUrl
});
```

### Upload Profile Image
```typescript
// For React Native, use base64 data from ImagePicker
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  base64: true, // Important: enable base64
});

if (!result.canceled && result.assets[0].base64) {
  const imageUrl = await storageService.uploadProfileImage(
    result.assets[0].base64,
    walletAddress,
    'image/jpeg'
  );
}
```

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│                 │    │                  │    │                     │
│   Mobile App    │────│   Supabase       │────│   Database          │
│   (React       │    │   (No Auth)      │    │   + Storage         │
│   Native)       │    │                  │    │                     │
│                 │    │                  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                              │
                              │
                       ┌──────▼──────┐
                       │             │
                       │ Wallet      │
                       │ Connection  │
                       │ (Identity)  │
                       │             │
                       └─────────────┘
```

## Security Considerations

**Important Notes for Production:**

1. **Public Access**: Current policies allow public access to all operations
2. **No Authentication**: We're relying on wallet addresses for identification only
3. **RLS Policies**: You may want to implement more restrictive policies based on your needs
4. **Data Validation**: Consider adding more validation at the application level

### Recommended Production Policies

For production use, you might want more restrictive policies:

```sql
-- Example: Restrict updates to specific conditions
create policy "Restrict updates by wallet" on public.users
  for update using (wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
  with check (wallet = current_setting('request.jwt.claims', true)::json->>'wallet');
```

## Troubleshooting

### Common Issues

1. **RLS Policies**: Make sure RLS is enabled and policies are created
2. **Storage Bucket**: Ensure the bucket exists and is public
3. **Credentials**: Verify your Supabase URL and anon key are correct
4. **Permissions**: Check that policies allow the operations you need

### Storage Upload Issues

If you get a "new row violates row-level security policy" error:

1. **Check if RLS is enabled**: Run this in your Supabase SQL editor:
   ```sql
   select relname, relrowsecurity from pg_class where relname = 'objects';
   ```

2. **Verify storage policies exist**:
   ```sql
   select * from pg_policies where tablename = 'objects';
   ```

3. **Quick fix - Disable RLS for storage** (less secure but works immediately):
   ```sql
   alter table storage.objects disable row level security;
   ```

4. **Or create proper policies** (more secure):
   ```sql
   -- Enable RLS
   alter table storage.objects enable row level security;
   
   -- Create policies for profile-images bucket
   create policy "Public access to profile-images" on storage.objects
     for all using (bucket_id = 'profile-images');
   ```

### Error Handling

The app includes error handling for:
- Network failures
- Database connection issues
- Storage upload failures
- Invalid data submissions

## Features

✅ **Database Operations**
- Create, read, update, delete user profiles
- Wallet-based user identification
- Automatic timestamps

✅ **File Storage**
- Profile image upload to Supabase Storage
- Automatic file naming and organization
- Public URL generation

✅ **No Auth Complexity**
- Simple client setup without auth configuration
- No session management
- Direct database access with permissive policies

✅ **Wallet Integration**
- Wallet address as primary identifier
- Profile linking to connected wallets
- No additional authentication required

This setup provides database and storage functionality without the complexity of authentication, perfect for wallet-based applications where the wallet itself serves as the identity provider! 🚀 