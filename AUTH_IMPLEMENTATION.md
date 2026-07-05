# Authentication Implementation Guide

## Overview
Your authentication system has been fully configured with:
- ✅ Two-token system (access token stored in localStorage)
- ✅ Backend token verification middleware
- ✅ Protected routes that redirect to home on auth failure
- ✅ Global 401 error handling

---

## Key Components

### 1. **ProtectedRoute Component** 
Location: `frontend/src/app/components/ProtectedRoute.tsx`

- Checks if user/company has valid auth and token
- Redirects to home page (`/`) if not authenticated
- Used to wrap all protected pages

```tsx
<ProtectedRoute role="user">
  <UserDashboard />
</ProtectedRoute>
```

### 2. **Backend Authentication Middleware**

**Company Auth:** `backend/middlewares/authComapny.js`
- Verifies JWT token from Authorization header
- Returns 401 if token invalid/missing
- Attaches company data to `req.company`

**Consumer Auth:** `backend/middlewares/authConsumer.js`
- Verifies JWT token from Authorization header
- Returns 401 if token invalid/missing
- Attaches consumer data to `req.consumer`

### 3. **Frontend API Handler** 
Location: `frontend/src/app/lib/api.ts`

**Key Features:**
- Automatically includes Bearer token in all requests
- Global 401 handler → clears auth → redirects to home
- Supports both 'user' and 'company' roles

```typescript
// Auto-redirects to home on 401
if (response.status === 401) {
  clearAuth(role);
  window.location.href = '/';
}
```

### 4. **Protected Routes** 
Location: `frontend/src/app/routes.tsx`

Protected pages include:
- **User Routes:** `/user/dashboard`, `/user/complaints`, `/user/notifications`, `/user/requests/:id`
- **Company Routes:** `/company/dashboard`, `/company/profile`, `/company/services/create`, `/company/reviews`, `/company/notifications`

Public routes:
- `/` (Landing)
- `/user/login`, `/user/signup`
- `/company/login`, `/company/signup`

---

## How It Works

### Login Flow
```
User Login → Backend validates → Returns accessToken
                                 → Frontend saves token & sets userAuth=true
                                 → Redirects to /user/dashboard
                                 
ProtectedRoute checks:
✅ userAuth === 'true'
✅ userToken exists
→ Allows access
```

### Unauthorized Access Flow
```
User directly accesses /user/dashboard (no token)
                          ↓
ProtectedRoute checks auth
                          ↓
No token/auth found
                          ↓
Redirect to home page (/)
```

### Token Expiry Flow
```
User makes API request with expired token
                          ↓
Backend returns 401 (Unauthorized)
                          ↓
apiRequest catches 401 error
                          ↓
clearAuth() removes all auth data
                          ↓
window.location.href = '/' redirects to home
```

### Logout Flow
```
User clicks logout
         ↓
clearAuth() removes tokens & auth flags
         ↓
Redirect to home page
```

---

## localStorage Keys Used

### For Users
- `userToken` - JWT access token
- `userAuth` - Flag ('true' if authenticated)
- `userId` - User's database ID
- `userName` - User's name
- `userEmail` - User's email

### For Companies
- `companyToken` - JWT access token
- `companyAuth` - Flag ('true' if authenticated)
- `companyId` - Company's database ID
- `companyName` - Company's name
- `companyEmail` - Company's email

---

## Testing Your Implementation

### Test 1: Redirect Unauthenticated Users
```
1. Open browser DevTools → Application → Clear all localStorage
2. Navigate to http://localhost:5173/user/dashboard
3. Should redirect to home page (/)
```

### Test 2: Successful Login
```
1. Go to /user/login
2. Enter valid credentials
3. Should see userAuth='true' and userToken in localStorage
4. Should redirect to /user/dashboard
```

### Test 3: Session Expiry
```
1. Login successfully
2. Open DevTools → Application → Remove userToken
3. Make any request on dashboard
4. Should see "Session expired" error
5. Should redirect to home page
```

### Test 4: Logout
```
1. Click logout button on dashboard
2. All auth keys removed from localStorage
3. Redirect to home page
```

---

## Backend Route Protection

Make sure your routes use the auth middleware:

```javascript
// Example: Company route
router.get('/company/dashboard', authCompany, companyDashboardController);

// Example: Consumer route
router.get('/consumer/requests', authConsumer, consumerRequestController);
```

If middleware receives 401, it will send:
```json
{
  "message": "Unauthorized"
}
```

Frontend will catch this and redirect to home.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| User not redirecting after login | Check if `localStorage.setItem('userAuth', 'true')` is called after login |
| Protected page still accessible without login | Ensure ProtectedRoute wraps the component correctly |
| Redirect happens but stays on page briefly | This is normal - use loading states to improve UX |
| Token not sent in API requests | Verify token exists in localStorage with correct key name |
| 401 errors not redirecting | Check browser DevTools Network tab - response should be 401 status |

---

## Next Steps

1. ✅ **Test authentication flow** - Use the tests above
2. ✅ **Verify backend routes are protected** - Ensure all sensitive routes use auth middleware
3. ✅ **Add loading states** - Optional: Show loading during redirect for better UX
4. ✅ **Refresh token rotation** - Optional: Implement refresh token logic if needed
