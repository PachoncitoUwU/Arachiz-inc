# Git Conflict Resolution Guide

## Issues Fixed

### 1. CSS Import Error ✅
**File**: `frontend/src/index.css`
**Issue**: `@import` statement was after Tailwind directives
**Fix**: Moved `@import './styles/animations.css';` to line 1 (before Tailwind directives)

### 2. Server Startup Error ✅
**Issue**: "Cannot find module 'express-session'"
**Status**: Actually fixed - server starts but port 3000 is in use
**Solution**: 
- Kill existing process on port 3000: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- Or change server port in `.env` file

### 3. Modal Sizing Issues ✅
**Files Modified**:
- `frontend/src/components/Modal.jsx` - Added `maxHeight: 'calc(100vh - 200px)'` to content area
- `frontend/src/pages/instructor/Excusas.jsx`:
  - Reduced main modal from `max-w-4xl` to `max-w-3xl`
  - Added scrolling to quick response list: `max-h-96 overflow-y-auto pr-2`

## Git Conflicts to Resolve

### 1. exportController.js ✅
**Conflict**: `const { PrismaClient } = require('@prisma/client'); const ExcelJS = require('exceljs');` vs `const prisma = require('../lib/prisma');`
**Resolution**: Keep ExcelJS version (more functionality)
**Status**: Already resolved in current file

### 2. package-lock.json Conflicts

#### Conflict 1: `normalize-path` vs `nodemailer/oauth`
```
<<<<<<< funcion-de-excusas
"node_modules/normalize-path": {
  "version": "3.0.0",
  "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
  "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
  "license": "MIT",
  "engines": {"node": ">=0.10.0"}
},
=======
"node_modules/nodemailer": {
  "version": "8.0.5",
  "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-8.0.5.tgz",
  "integrity": "sha512-0PF8Yb1yZuQfQbq+5/pZJrtF6WQcjTd5/S4JOHs9PGFxuTqoB/icwuB44pOdURHJbRKX1PPoJZtY7R4VUoCC8w==",
  "license": "MIT-0",
  "engines": {"node": ">=6.0.0"}
},
"node_modules/oauth": {
  "version": "0.10.2",
  "resolved": "https://registry.npmjs.org/oauth/-/oauth-0.10.2.tgz",
  "integrity": "sha512-JtFnB+8nxDEXgNyniwz573xxbKSOu3R8D40xQKqcjwJ2CDkYqUDI53o6IuzDJBx60Z8VKCm271+t8iFjakrl8Q==",
  "license": "MIT"
},
>>>>>>> main
```

**Resolution**: Keep BOTH sections (different packages)
**How to fix**: Remove conflict markers and keep both:
```json
"node_modules/normalize-path": {
  "version": "3.0.0",
  "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
  "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
  "license": "MIT",
  "engines": {"node": ">=0.10.0"}
},
"node_modules/nodemailer": {
  "version": "8.0.5",
  "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-8.0.5.tgz",
  "integrity": "sha512-0PF8Yb1yZuQfQbq+5/pZJrtF6WQcjTd5/S4JOHs9PGFxuTqoB/icwuB44pOdURHJbRKX1PPoJZtY7R4VUoCC8w==",
  "license": "MIT-0",
  "engines": {"node": ">=6.0.0"}
},
"node_modules/oauth": {
  "version": "0.10.2",
  "resolved": "https://registry.npmjs.org/oauth/-/oauth-0.10.2.tgz",
  "integrity": "sha512-JtFnB+8nxDEXgNyniwz573xxbKSOu3R8D40xQKqcjwJ2CDkYqUDI53o6IuzDJBx60Z8VKCm271+t8iFjakrl8Q==",
  "license": "MIT"
},
```

#### Conflict 2: `path-is-absolute` vs `passport`
```
<<<<<<< funcion-de-excusas
"node_modules/path-is-absolute": {
  "version": "1.0.1",
  "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
  "integrity": "sha512-AVbw3UJ2e9bq64vSaS9Am0fje1Pa8pbGqTTsmXfaIiMpnr5DlDhfJOuLj9Sf95ZPVDAUerDfEk88MPmPe7UCQg==",
  "license": "MIT",
  "engines": {"node": ">=0.10.0"}
=======
"node_modules/passport": {
  "version": "0.7.0",
  "resolved": "https://registry.npmjs.org/passport/-/passport-0.7.0.tgz",
  "integrity": "sha512-cPLl+qZpSc+ireUvt+IzqbED1cHHkDoVYMo30jbJIdOOjQ1MQYZBPiNvmi8UM6lJuOpTPXJGZQk0DtC4y61MYQ==",
  "license": "MIT",
  "dependencies": {
    "passport-strategy": "1.x.x",
    "pause": "0.0.1",
    "utils-merge": "^1.0.1"
  },
  "engines": {"node": ">= 0.4.0"},
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/jaredhanson"
  }
},
"node_modules/passport-google-oauth20": {
  "version": "2.0.0",
  "resolved": "https://registry.npmjs.org/passport-google-oauth20/-/passport-google-oauth20-2.0.0.tgz",
  "integrity": "sha512-KSk6IJ15RoxuGq7D1UKK/8qKhNfzbLeLrG3gkLZ7p4A6DBCcv7xpyQwuXtWdpyR0+E0mwkpjY1VfPOhxQrKzdQ==",
  "license": "MIT",
  "dependencies": {
    "passport-oauth2": "1.x.x"
  },
  "engines": {"node": ">= 0.4.0"}
},
"node_modules/passport-oauth2": {
  "version": "1.8.0",
  "resolved": "https://registry.npmjs.org/passport-oauth2/-/passport-oauth2-1.8.0.tgz",
  "integrity": "sha512-cjsQbOrXIDE4P8nNb3FQRCCmJJ/utnFKEz2NX209f7KOHPoX18gF7gBzBbLLsj2/je4KrgiwLLGjf0lm9rtTBA==",
  "license": "MIT",
  "dependencies": {
    "base64url": "3.x.x",
    "oauth": "0.10.x",
    "passport-strategy": "1.x.x",
    "uid2": "0.0.x",
    "utils-merge": "1.x.x"
  },
  "engines": {"node": ">= 0.4.0"},
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/jaredhanson"
  }
},
"node_modules/passport-strategy": {
  "version": "1.0.0",
  "resolved": "https://registry.npmjs.org/passport-strategy/-/passport-strategy-1.0.0.tgz",
  "integrity": "sha512-CB97UUvDKJde2V0KDWWB3lyf6PC3FaZP7YxZ2G8OAtn9p4HI9j9JLP9qjOGZFvyl8uwNT8qM+hGnz/n16NI7oA==",
  "engines": {"node": ">= 0.4.0"}
>>>>>>> main
```

**Resolution**: Keep BOTH sections (different packages)
**How to fix**: Remove conflict markers and keep both:
```json
"node_modules/path-is-absolute": {
  "version": "1.0.1",
  "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
  "integrity": "sha512-AVbw3UJ2e9bq64vSaS9Am0fje1Pa8pbGqTTsmXfaIiMpnr5DlDhfJOuLj9Sf95ZPVDAUerDfEk88MPmPe7UCQg==",
  "license": "MIT",
  "engines": {"node": ">=0.10.0"}
},
"node_modules/passport": {
  "version": "0.7.0",
  "resolved": "https://registry.npmjs.org/passport/-/passport-0.7.0.tgz",
  "integrity": "sha512-cPLl+qZpSc+ireUvt+IzqbED1cHHkDoVYMo30jbJIdOOjQ1MQYZBPiNvmi8UM6lJuOpTPXJGZQk0DtC4y61MYQ==",
  "license": "MIT",
  "dependencies": {
    "passport-strategy": "1.x.x",
    "pause": "0.0.1",
    "utils-merge": "^1.0.1"
  },
  "engines": {"node": ">= 0.4.0"},
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/jaredhanson"
  }
},
"node_modules/passport-google-oauth20": {
  "version": "2.0.0",
  "resolved": "https://registry.npmjs.org/passport-google-oauth20/-/passport-google-oauth20-2.0.0.tgz",
  "integrity": "sha512-KSk6IJ15RoxuGq7D1UKK/8qKhNfzbLeLrG3gkLZ7p4A6DBCcv7xpyQwuXtWdpyR0+E0mwkpjY1VfPOhxQrKzdQ==",
  "license": "MIT",
  "dependencies": {
    "passport-oauth2": "1.x.x"
  },
  "engines": {"node": ">= 0.4.0"}
},
"node_modules/passport-oauth2": {
  "version": "1.8.0",
  "resolved": "https://registry.npmjs.org/passport-oauth2/-/passport-oauth2-1.8.0.tgz",
  "integrity": "sha512-cjsQbOrXIDE4P8nNb3FQRCCmJJ/utnFKEz2NX209f7KOHPoX18gF7gBzBbLLsj2/je4KrgiwLLGjf0lm9rtTBA==",
  "license": "MIT",
  "dependencies": {
    "base64url": "3.x.x",
    "oauth": "0.10.x",
    "passport-strategy": "1.x.x",
    "uid2": "0.0.x",
    "utils-merge": "1.x.x"
  },
  "engines": {"node": ">= 0.4.0"},
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/jaredhanson"
  }
},
"node_modules/passport-strategy": {
  "version": "1.0.0",
  "resolved": "https://registry.npmjs.org/passport-strategy/-/passport-strategy-1.0.0.tgz",
  "integrity": "sha512-CB97UUvDKJde2V0KDWWB3lyf6PC3FaZP7YxZ2G8OAtn9p4HI9j9JLP9qjOGZFvyl8uwNT8qM+hGnz/n16NI7oA==",
  "engines": {"node": ">= 0.4.0"}
},
```

## Next Steps

1. **Resolve package-lock.json conflicts** in GitHub UI by keeping both sections for each conflict
2. **Run `npm install`** in backend directory after resolving conflicts
3. **Kill existing server** on port 3000 or change port
4. **Test the modal fixes** - modals should now be properly sized and scrollable

## Verification

After fixing conflicts and running `npm install`:
- Server should start without "Cannot find module" errors
- CSS import error should be gone
- Modals should fit within screen boundaries
- Quick response modal should scroll when there are many responses