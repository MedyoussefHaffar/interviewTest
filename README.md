# Patient Management System

A full-stack patient management application that integrates with a third-party patient API, providing a seamless interface to manage both local and external patient data.

![](images/87ad7533ed2387beca39e8a294c167125d324e4cf5244969d317ef01f51e1375.jpg)

# Project Overview

This application allows healthcare providers to:

View patients from both local database and external API  
- Create new patients (stored in both systems)  
- Copy external patients to local database for full functionality  
- Process patient data with health metrics analysis  
- Delete local patients

![](images/f72dc9324bba07f8ac752d72a2f42bc9be25824c98a5765d53a8682ac62a2c54.jpg)

# Tech Stack

# Backend

- Framework: Django + Django REST Framework  
- Database: SQLite (development) / PostgreSQL (production)  
- Caching: Django's LocMemCache  
CORS: django-cors-headers

# Frontend

- Framework: Next.js 14 with TypeScript  
- UI Library: shadcn/ui + Tailwind CSS  
- Charts: Recharts  
- Notifications: Sonner toast

![](images/5555dc9590db17618f7db2e51adeec4ba6cc031d5a2053be3fef577b6c570971.jpg)

# Quick Start

# Prerequisites

- Python 3.8+  
Node.js 18+  
Git

# 1. Clone the Repository

bash

```txt
git clone <your-repo-url>  
cd patient-management-system
```

# 2. Backend Setup

bash

```txt
1 # Navigate to backend directory
```

```txt
2 cd backend  
3  
4 # Create virtual environment  
5 python -m venv venv  
6  
7 # Activate virtual environment  
8 # On Windows:  
9 venv\Scripts\activate  
10 # On Mac/Linux:  
11 source venv/bin/activate  
12  
13 # Install dependencies  
14 pip install -r requirements.txt  
15  
16 # Setup environment variables  
17 cp .env.example .env  
18 # Edit .env with your configuration  
19  
20 # Run migrations  
21 python manage.py migrate  
22  
23 # Create superuser (optional)  
24 python manage.py createsuperuser  
25  
26 # Start development server  
27 python manage.py runserver
```

The backend will be available at http://localhost:8000

# 3. Frontend Setup

bash

```shell
1 # Navigate to frontend directory (from project root)  
2 cd ../frontend  
3  
4 # Install dependencies  
5 npm install  
6  
7 # Setup environment variables  
8 cp .env.local.example .env.local
```

Edit .env.local:

env

```txt
1 NEXT.Public_API_BASE_url=http://localhost:8000/api
```

bash

```txt
1 # Start development server  
2 npm run dev
```

The frontend will be available at http://localhost:3000

# Database Setup

Development (SQLite)

The application uses SQLite by default for development. No additional setup required.

Production (PostgreSQL)

Update DATABASES in vesyntaTONbackend/settings.py:

python

```javascript
1 DATABASES  $=$  { 'default':{ 'ENGINE':'django.db.backends.postgresql', NAME':'your_db_name', 'USER':'your_username', 'DATABASE':'your_password', 'HOST':'localhost', 'PORT':'5432', }   
10 1
```

Then run migrations:

bash

```txt
1 python manage.py migrate
```

![](images/dc686ea13d27710d2e171cb581748c4e138c2a56572b559a7b3b447ac7636373.jpg)

# Configuration

Backend Environment Variables (.env)

env

```txt
1 DEBUG=True   
2 SECRET_KEY=your-secret-key-here   
3 EXTERNAL_API_URL=https://coding-patient-api.vesynta.workers.dev   
4 DATABASE_URL=sqlite:///db.sqlite3   
5 CACHETIMEOUT= 3600   
6 RATE_LIMIT_PER_MINUTE= 90
```

Frontend Environment Variables (.env.local)

env

```txt
1 NEXT.Public_API_BASE_url=http://localhost:8000/api
```

![](images/a7070c10c6061a2659435b26fda8e64b1c731c116eba9880ebe2dee299da58b8.jpg)

# Features

Patient Management

- View All Patients: See patients from both local and external sources in a unified list  
- Create Patients: Add new patients to both local and external systems  
- Copy External Patients: Convert read-only external patients to editable local copies  
- Delete Patients: Remove patients from local database (external patients are read-only)

Patient Processing

- Health Metrics: Process patient data with weight and height measurements  
- Visual Analytics: View processing results with interactive line charts  
- BMI Calculation: Automatic BMI calculation from patient measurements

Data Sources

- Local Patients: Fully editable patients stored in your database  
- External Patients: Read-only patients from third-party API  
- Synced Patients: Patients that exist in both systems

# Patients

. GET /api/patients - List all patients (with pagination)  
. POST /api/patients - Create a new patient  
. GET /api/patients/{id} - Get patient details  
. DELETE /api/patients/{id}/delete - Delete a local patient  
. POST /api/patients/create-local-copy - Copy external patient to local database

# Patient Processing

. POST /api/patients/{id}/process - Process patient health metrics

# User Guide

# Viewing Patients

1. Open the application in your browser at http://localhost:3000  
2. The main dashboard shows patient statistics and list  
3. Patients are color-coded by source:

$\bullet$  Blue: Local only patients  
Green: External patients (read-only)  
Purple: Synced patients (both local and external)

# Creating Patients

1. Click the "New Patient" button  
2. Fill in the patient information:

。First Name  
。Last Name  
Date of Birth  
。Sex  
- Ethnic Background

3. Click "Create Patient" to save to both systems

# Copying External Patients

1. Find an external patient (marked with "External" badge)  
2. Click "Copy to Local" button  
3. The patient will be copied to your local database  
4. You can now edit, process, or delete this patient

# Processing Patient Data

1. Click "View" on a local patient  
2. Navigate to the "Process" tab  
3. Enter weight and height measurements  
4. Click "Process Patient" to generate health metrics  
5. View results in chart and table formats

# Deleting Patients

1. Only local patients can be deleted  
2. Click the "Delete" button on a local patient  
3. Confirm deletion in the dialog

# Troubleshooting

# Common Issues

# CORS Errors

- Ensure backend CORS settings allow your frontend URL  
Check that CORS_OPENED Origins includes http://localhost:3000

# External API Not Working

- Verify the external API URL in backend environment variables  
- Check network connectivity to the external API

# Database Issues

- Run python manage.py migrate to apply migrations  
- Check database permissions and connection strings

# Frontend Build Issues

- Clear node modules: rm -rf node Modules && npm install  
- Check Node.js version compatibility

# Debug Mode

Enable debug mode in backend by setting DEBUG=True in your .env file for detailed error messages.

# Deployment

# Backend Deployment (Example: PythonAnywhere)

1. Upload your backend code  
2. Setup virtual environment  
3. Install requirements: pip install -r requirements.txt  
4. Run migrations: python manage.py migrate  
5. Collect static files: python manage.py collectstatic  
6. Configure web app with your WSGI file

# Frontend Deployment (Example: Vercel)

1. Connect your GitHub repository to Vercel  
2. Set environment variables in Vercel dashboard  
3. Deploy automatically on git push

# Production Configuration

- Set DEBUG=False in production  
- Use PostgreSQL instead of SQLite

- Configure proper CORS origins  
- Set up production-grade cache (Redis recommended)  
- Use environment variables for all secrets

# Development

# Running Tests

bash

```txt
1 #Backend tests   
2 python manage.py test   
3   
4 #Frenteend tests   
5 npm run test
```

# Code Structure

text

```yaml
patient-management-system/
- backend/
- patients/
- models.py # Patient data model
- services.py # Business logic and external API
integration
- views.py # API endpoints
- serializers.py # Data validation and serialization
- vesynta.backend/
- settings.py # Django configuration
- frontend/
- app/
- page.tsx # Main dashboard
- patients/[id]/
- page.tsx # Patient detail page
- components/
- patient-list.tsx # Patient table component
- patient-form.tsx # Create patient form
- process-result-chart.tsx # Chart component
- lib/
- api.ts # API service functions
```

![](images/37194d9d7c864f4b8b4ed1440d48572624234c256a4d3d00eb5576c3b5934b66.jpg)

# Support

For issues and questions:

1. Check the troubleshooting section above  
2. Review API documentation at https://coding-patient-api.vesynta.workers.dev  
3. Create an issue in the GitHub repository

![](images/a2e6c9df3b3abe9be9e5a8b3ac0ce1945d9e8ea5fe764898ab2a4c3f33c597ec.jpg)

# License

This project is for assessment purposes as part of the Vesynta coding challenge.

Note: This application is designed to demonstrate full-stack development skills including API integration, database design, caching strategies, and modern UI/UX implementation.
