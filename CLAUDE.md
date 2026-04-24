# Project: Venue Management System
## Tech Stack: DynamoDB (Data), S3 (Photos), Tailwind (UI)

## Design Patterns to Follow:
- **Repository Pattern**: All database calls to DynamoDB must be inside `src/repositories/`.
- **Factory Pattern**: Use a factory to generate venue cards in the UI.
- **Singleton Pattern**: The S3 and DynamoDB clients must be initialized once.

## Coding Style:
- Use TypeScript for all backend logic.
- Use Tailwind CSS for responsive design.
- Keep components small and modular.