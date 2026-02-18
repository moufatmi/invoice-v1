# Portal Separation Guide

## Overview
The application now has two completely separate portals accessible via different URLs:

## 🔗 Portal URLs

### Agent Portal
- **URL**: `http://localhost:5174/agent` or `http://localhost:5174/`
- **Purpose**: For travel agents to create, manage, and edit invoices
- **Features**:
  - Create new invoices
  - Edit existing invoices
  - View invoice details
  - Manage client information
  - Download PDF invoices
  - Dashboard with invoice statistics

### Admin Portal
- **URL**: `http://localhost:5174/admin`
- **Purpose**: For directors to oversee all agent activities and invoices
- **Features**:
  - View all invoices across all agents
  - Edit any invoice (regardless of creator)
  - Monitor agent performance
  - Advanced dashboard with comprehensive analytics
  - Status management for all invoices

## 🔄 Navigation Between Portals

### Portal Navigation Widget
A floating navigation widget is available on all pages in the top-right corner that allows quick switching between portals.

### Direct Navigation
- **From Agent to Admin**: Click "Director Access" button on the agent login page or use the portal navigation widget
- **From Admin to Agent**: Click "Back to Agent Portal" on the admin login page or use the portal navigation widget

## 🔐 Authentication & Access Control

### Agent Portal
- Agents authenticate and get redirected to their appropriate portal based on role
- Directors accessing the agent portal are automatically redirected to the admin portal

### Admin Portal
- Requires director-level credentials
- Regular agents attempting to access admin portal are redirected to agent portal
- Enhanced security with role verification

## 🚀 Technical Implementation

### Router Structure
```
/ (root) → redirects to /agent
/agent → Agent Portal Page
/admin → Admin Portal Page
/* (catch-all) → redirects to /agent
```

### Key Components
- **AgentPortalPage**: Main agent interface wrapper
- **AdminPortalPage**: Main admin interface wrapper
- **AdminLoginForm**: Custom login form for admin portal
- **PortalNavigation**: Floating navigation widget
- **AppRouter**: Main routing configuration

### Authentication Flow
1. **Agent Portal**: User signs up/logs in → Role check → Redirect to appropriate portal
2. **Admin Portal**: Director credentials required → Role verification → Access granted

## 📱 User Experience

### Visual Distinction
- **Agent Portal**: Blue/teal color scheme, agent-focused messaging
- **Admin Portal**: Purple color scheme, admin-focused messaging
- Different page titles for better browser tab identification

### Responsive Design
Both portals maintain full responsiveness across all device sizes.

### Error Handling
- Proper error messages for unauthorized access attempts
- Graceful fallbacks and redirections
- Network status indicators

## 🛠️ Development

### URL Testing
```bash
# Agent Portal
http://localhost:5174/
http://localhost:5174/agent

# Admin Portal
http://localhost:5174/admin
```

### Page Titles
- Agent Portal: "Agent Portal - Invoice Management System"
- Admin Portal: "Admin Portal - Invoice Management System"

This separation provides a clear distinction between user roles while maintaining a seamless experience for each user type.
