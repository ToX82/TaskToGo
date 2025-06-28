# TaskToGo

A simple and elegant task management tool designed for Vivaldi's side panel. TaskToGo offers a clean, responsive interface for managing tasks, categories, and priorities with full CRUD functionality.

## Features

- **Task Management**: Create, read, update, and delete tasks
- **Categories & Priorities**: Organize tasks with colored categories and priorities
- **Responsive Design**: Works seamlessly in Vivaldi's side panel and full-screen
- **Internationalization**: Supports English and Italian with automatic language detection
- **Local Storage**: All data is stored locally in your browser
- **Quick Add**: Fast task creation with minimal input
- **Filtering**: Filter tasks by category, priority, and completion status
- **Due Dates**: Set and track task due dates with visual indicators
- **Compact Interface**: Optimized for space efficiency

## Technology Stack

- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **jQuery**: DOM manipulation and event handling
- **Iconify**: Beautiful icons
- **localStorage**: Client-side data persistence

## Project Structure

```
task_to_go/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Custom CSS styles
├── js/
│   ├── app.js              # Main application logic
│   ├── i18n.js             # Internationalization system
│   ├── storage.js          # localStorage management
│   ├── models.js           # Data models and business logic
│   └── ui.js               # UI management and rendering
├── locales/
│   ├── en.json             # English translations
│   └── it.json             # Italian translations
└── README.md               # This file
```

## Getting Started

1. **Open the application**: Simply open `index.html` in your web browser
2. **Add to Vivaldi**: Use the file path as a web panel URL in Vivaldi
3. **Start managing tasks**: Begin by adding your first task using the quick add form

## Usage

### Quick Add
- Use the input field at the top to quickly add tasks
- Tasks are automatically assigned to the first category and normal priority

### Full Task Management
- Click "Add Task" for detailed task creation
- Set title, description, category, priority, and due date
- Edit tasks by clicking the pencil icon
- Delete tasks by clicking the trash icon
- Mark tasks as complete using the checkbox

### Categories and Priorities
- Access settings via the gear icon in the header
- Add, edit, and delete categories with custom colors
- Manage priorities with custom colors and ordering
- Deleted categories/priorities are automatically handled

### Filtering
- Filter tasks by category or priority using the dropdown menus
- Toggle completed task visibility
- All filters work together for precise task management

### Language Support
- Automatic language detection based on browser settings
- Manual language switching via the dropdown in the header
- Currently supports English and Italian

## Architecture

The application follows SOLID principles and clean architecture:

- **Separation of Concerns**: Each file has a specific responsibility
- **Model-View-Controller**: Clear separation between data, UI, and logic
- **Dependency Injection**: Components are loosely coupled
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Integrity**: Automatic data validation and corruption recovery

## Browser Compatibility

- Chrome/Chromium (including Vivaldi) 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Code Style
- Follows PSR-12 inspired JavaScript conventions
- Comprehensive JSDoc documentation
- Consistent naming conventions
- Modular architecture

### Best Practices
- KISS (Keep It Simple, Stupid)
- DRY (Don't Repeat Yourself)
- SOLID principles
- Responsive design
- Accessibility considerations

## Data Management

### Storage
- All data is stored in browser's localStorage
- Automatic backup every 5 minutes
- Data integrity checks and automatic recovery
- Export/import functionality (planned feature)

### Data Structure
```javascript
{
  tasks: [
    {
      id: "unique_id",
      title: "Task title",
      description: "Task description",
      categoryId: "category_id",
      priorityId: "priority_id",
      completed: false,
      dueDate: "2024-01-01",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      completedAt: null
    }
  ],
  categories: [
    {
      id: "unique_id",
      name: "Category name",
      color: "#3B82F6",
      createdAt: "2024-01-01T00:00:00.000Z"
    }
  ],
  priorities: [
    {
      id: "unique_id",
      name: "Priority name",
      color: "#EF4444",
      order: 1,
      createdAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Customization

### Adding New Languages
1. Create a new JSON file in the `locales/` directory
2. Follow the structure of existing translation files
3. Add the language code to the `I18n` class in `i18n.js`
4. Update the language selector in `index.html`

### Styling
- Modify `css/styles.css` for custom styles
- Tailwind classes can be customized via CDN configuration
- Color schemes are easily adjustable through CSS variables

## Performance

- Lightweight footprint (~50KB total)
- Fast rendering with efficient DOM manipulation
- Optimized for mobile and desktop
- Minimal external dependencies

## Security

- No external data transmission
- Client-side only application
- No server-side vulnerabilities
- Data remains private and local

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please follow the established code style and architecture patterns.

## Support

For issues or questions, please check the browser console for error messages and ensure you're using a supported browser version.