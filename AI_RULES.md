# AI Rules for Connect Vida Application

This document outlines the technical stack and specific library usage guidelines for the Connect Vida application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen technologies.

## Tech Stack Overview

*   **Framework**: React (v18.x)
*   **Language**: TypeScript (v5.x)
*   **Build Tool**: Vite (v5.x)
*   **Styling**: Tailwind CSS (v3.x)
*   **UI Components**: shadcn/ui (built on Radix UI)
*   **Routing**: React Router DOM (v6.x)
*   **State Management**: Zustand
*   **Data Fetching/Caching**: TanStack Query (React Query)
*   **Toast Notifications**: Sonner
*   **Icons**: Lucide React
*   **Date Utilities**: date-fns

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these specific guidelines for library usage:

1.  **UI Components**:
    *   **Primary Choice**: Always prioritize `shadcn/ui` components for building the user interface. These components are pre-styled with Tailwind CSS and provide accessibility features.
    *   **Custom Components**: If a specific `shadcn/ui` component does not exist or requires significant customization beyond what props allow, create a new, dedicated component file in `src/components/`. Do **NOT** modify `shadcn/ui` component files directly.
    *   **Styling Custom Components**: All custom components should be styled exclusively using Tailwind CSS classes.

2.  **Styling**:
    *   **Exclusive Use**: Tailwind CSS is the sole styling framework for this project. Apply styles using Tailwind utility classes directly in your JSX.
    *   **Global Styles**: `src/index.css` is reserved for `@tailwind` directives and base CSS variables. Avoid adding component-specific styles here.
    *   **Utility for Classes**: Use the `cn` utility function (from `src/lib/utils.ts`) for conditionally combining and merging Tailwind CSS classes.

3.  **State Management**:
    *   **Global State**: Use Zustand for managing global application state, such as user authentication (`useAuthStore`).
    *   **Local Component State**: For state confined to a single component, use React's `useState` and `useReducer` hooks.

4.  **Data Fetching & Server State**:
    *   **Primary Choice**: Use TanStack Query (React Query) for managing server-side data, including fetching, caching, synchronization, and error handling.

5.  **Routing**:
    *   **Client-Side Routing**: React Router DOM is used for all client-side navigation.
    *   **Route Definition**: All primary application routes should be defined within `src/App.tsx`.

6.  **Icons**:
    *   **Exclusive Use**: All icons throughout the application must come from the `lucide-react` library.

7.  **Notifications**:
    *   **Toast System**: Use `sonner` for displaying all types of toast notifications (success, error, info, loading).

8.  **Date Manipulation**:
    *   **Utility Library**: Use `date-fns` for any date formatting, parsing, or manipulation tasks.

9.  **File Structure**:
    *   **Components**: New components should always be created in `src/components/` (or a relevant subfolder like `src/components/admin/`).
    *   **Pages**: Application pages should reside in `src/pages/`.
    *   **Hooks**: Custom React hooks should be placed in `src/hooks/`.
    *   **Stores**: Zustand stores should be in `src/stores/`.
    *   **Utilities**: General utility functions should be in `src/lib/` or `src/utils/`.

By following these rules, we ensure a cohesive, performant, and easily maintainable application.