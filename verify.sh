#!/bin/bash

echo "🔍 Verifying Supabase Tables..."
echo ""

# Use supabase to execute queries
# We'll check table counts via raw SQL queries

echo "1️⃣ Checking tables exist..."
echo "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" | npx supabase db execute

echo ""
echo "2️⃣ Checking admins..."
echo "SELECT COUNT(*) as count FROM public.admins;" | npx supabase db execute

echo ""
echo "3️⃣ Checking rooms..."
echo "SELECT COUNT(*) as count FROM public.rooms;" | npx supabase db execute

echo ""
echo "4️⃣ Checking if RPC functions exist..."
echo "SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_type='FUNCTION';" | npx supabase db execute
