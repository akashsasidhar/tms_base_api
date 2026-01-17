# Starting the Backend Server

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or use the simple version:
   ```bash
   npm run dev:simple
   ```

## Troubleshooting

### If `npm run dev` doesn't work:

1. **Check if nodemon is installed:**
   ```bash
   npm list nodemon
   ```

2. **Try the simple dev script:**
   ```bash
   npm run dev:simple
   ```

3. **Check for TypeScript errors:**
   ```bash
   npm run type-check
   ```

4. **Verify ts-node works:**
   ```bash
   npx ts-node --version
   ```

5. **Check if server.ts exists:**
   ```bash
   ls server.ts
   # or on Windows:
   dir server.ts
   ```

### Common Issues:

- **Module not found errors**: Make sure all dependencies are installed (`npm install`)
- **Database connection errors**: Check your `.env` file and database configuration
- **Port already in use**: Change the PORT in `.env` or kill the process using port 5000
- **TypeScript errors**: Run `npm run type-check` to see compilation errors

### Manual Start (if all else fails):

```bash
npx ts-node -r tsconfig-paths/register server.ts
```

## Environment Variables

Make sure you have a `.env` file in the backend directory with:
- Database connection details
- JWT secrets
- Port configuration
- CORS settings

See `.env.example` for reference.
