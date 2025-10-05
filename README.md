## Description

This project is a tactical board application designed for handball coaches and players. It allows users to create, edit, and visualize handball tactics and strategies using an interactive board.

This project is also meant to play with latest angular features and best practices.

## Technologies

### Frontend

- Angular
- Konva.js for canvas rendering

### AI Tools

- Claude AI for code assistance

### To test

- n8n
- nestjs
- PostgreSQL
- Some devops to deploy the whole

## Known Issues

- Filter activation incorrectly resets player positions

## Planned Features & Improvements

### Shape System Refactoring

- Simplify the inheritance structure for better code maintainability
- Refactor the handball court renderer to accommodate future expansion
- Implement proper layering so the ball appears behind players during interactions

### Animation & Action System

- Implement playback controls:

  - Play animations
  - Pause animations
  - Stop animations

- Develop a visual editor for creating and modifying player movements

- Add functionality to save and load replay files

- Support multiple simultaneous actions within a single frame

### Keyboard Shortcuts (Low Priority)

- Complete system redesign for improved usability and code quality
