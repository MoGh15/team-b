# Team B Frontend - User Management System

React-based user management interface for the Clinic Health Forms system.

## Features

- **User Management Page**: View all users with detailed information
- **Create/Edit Users**: Form-based user creation and editing
- **Role Selection**: Assign roles (admin, doctor, nurse, receptionist)
- **User Status Display**: Show user status (active, inactive, pending)
- **Responsive Design**: Works on desktop and mobile devices
- **Card & Table Views**: Switch between card grid and table layouts

## Setup

### Prerequisites
- Node.js 16+
- Backend API running on http://localhost:4000

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── UserForm.jsx      # Form for creating/editing users
│   │   ├── UserList.jsx      # List view of all users
│   │   ├── UserCard.jsx      # Individual user card
│   │   └── *.css             # Component styles
│   ├── pages/
│   │   ├── UserManagement.jsx # Main management page
│   │   └── UserManagement.css
│   ├── api/
│   │   └── userApi.js        # API integration
│   ├── App.jsx               # Root component
│   ├── App.css
│   ├── index.css             # Global styles
│   └── main.jsx              # Entry point
├── package.json
├── vite.config.js            # Vite configuration
└── Dockerfile                # Docker configuration
```

## API Integration

The frontend communicates with the backend API endpoints:

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/health` - Health check

## Features Implemented

### User Management Page
- Display all users in card and table formats
- Refresh functionality
- Create new user button

### User Form
- Create new users
- Edit existing users
- Password management
- Role selection dropdown
- Status selection dropdown
- Form validation
- Error messages

### User List
- Card grid view (responsive)
- Table view with all user details
- Edit and delete buttons
- User status indicators
- User role badges
- Join date display

### User Card
- Avatar with initials
- User name and email
- Role badge
- Status badge
- Join date
- Edit and delete buttons

## Styling

The application uses:
- Custom CSS for styling
- Responsive design with CSS Grid
- Color-coded role and status badges
- Smooth transitions and animations

### Color Scheme
- Primary: #0066cc (Blue)
- Success: #4caf50 (Green)
- Error: #d32f2f (Red)
- Warning: #ff9800 (Orange)
- Background: #f5f5f5 (Light Gray)

## Docker

Build and run in Docker:

```bash
docker build -t team-b-frontend .
docker run -p 3000:3000 team-b-frontend
```

## Environment Variables

No environment variables required in development. The app connects to the backend at the configured API base URL.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
