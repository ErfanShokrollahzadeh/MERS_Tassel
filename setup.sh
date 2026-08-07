#!/bin/bash

# ============================================
# MERS Tassel - Quick Setup Script
# Run this from the project root: bash setup.sh
# ============================================

echo "🌸 Setting up MERS Tassel..."
echo ""

# ---- SERVER SETUP ----
echo "🐍 Setting up Django backend..."
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations products contact analytics
python manage.py migrate

# Seed sample data
python manage.py seed_data

echo ""
echo "✅ Django backend is ready!"
echo "   Run: cd server && source venv/bin/activate && python manage.py runserver"
echo ""

# ---- CLIENT SETUP ----
cd ../client

echo "⚡ Setting up Next.js frontend..."

# Install Node dependencies
npm install

echo ""
echo "✅ Next.js frontend is ready!"
echo "   Run: cd client && npm run dev"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📌 Quick Start:"
echo "   Terminal 1: cd server && source venv/bin/activate && python manage.py runserver"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:8000/api/"
echo "   Admin:    http://localhost:8000/admin/"
