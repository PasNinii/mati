# Filter System

A comprehensive, parametrizable filter system for Angular applications. This system allows you to easily configure and manage filters through JSON configuration files, with built-in URL serialization for sharing filter states.

## Features

- **Parametrizable**: Configure filters via JSON files
- **Generic & Extensible**: Easy to add new filter types
- **URL Serialization**: Share filter states via URL
- **Type-Safe**: Full TypeScript support
- **Reactive**: Built with Angular signals and RxJS
- **Multiple Filter Types**: Text, Select, Multi-Select, Number, Boolean, Date, Range

## Architecture

```
pattern/filter/          # Filter models and main component
├── filter.model.ts              # Filter class with serialization
├── filter-type.enum.ts          # Filter type enumeration
├── filter-config.interface.ts   # Configuration interfaces
├── filter.component.ts          # Main filter container component
└── filter.component.scss        # Styles

core/services/
└── filter.service.ts            # Filter state management & serialization

ui/                      # Individual filter components
├── text-filter/
├── select-filter/
├── multi-select-filter/
├── number-filter/
└── boolean-filter/

assets/filters/
└── filter-config.json           # Filter definitions
```

## Usage

### 1. Configure Filters

Create or modify `assets/filters/filter-config.json`:

```json
[
  {
    "id": "general",
    "name": "General Filters",
    "filters": [
      {
        "id": "search",
        "label": "Search",
        "type": "text",
        "placeholder": "Search...",
        "clearable": true
      },
      {
        "id": "status",
        "label": "Status",
        "type": "select",
        "placeholder": "Select status",
        "options": [
          { "label": "Active", "value": "active" },
          { "label": "Inactive", "value": "inactive" }
        ]
      }
    ]
  }
]
```

### 2. Use in Component

```typescript
import { Component } from '@angular/core';
import { FilterComponent } from './pattern/filter';
import { FilterService } from './core/services/filter.service';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [FilterComponent],
  template: `
    <app-filter [configPath]="'assets/filters/my-filters.json'" (filtersChanged)="onFiltersChanged($event)" />

    <div class="results">
      <!-- Your filtered content -->
    </div>
  `,
})
export class MyPageComponent {
  constructor(private filterService: FilterService) {}

  onFiltersChanged(state: FilterState) {
    console.log('Active filters:', state);
    // Apply filters to your data
  }
}
```

### 3. Programmatic Access

```typescript
// Get current filter state
const state = this.filterService.getFilterState();

// Update a filter
this.filterService.updateFilter('status', 'active');

// Clear all filters
this.filterService.clearAllFilters();

// Share via URL
const url = this.filterService.serializeToUrl();

// Load from URL
this.filterService.deserializeFromUrl(urlState);
```

## Filter Types

### Text Filter

```json
{
  "id": "search",
  "label": "Search",
  "type": "text",
  "placeholder": "Search...",
  "clearable": true
}
```

### Select Filter

```json
{
  "id": "category",
  "label": "Category",
  "type": "select",
  "options": [
    { "label": "Option 1", "value": "opt1" },
    { "label": "Option 2", "value": "opt2" }
  ]
}
```

### Multi-Select Filter

```json
{
  "id": "tags",
  "label": "Tags",
  "type": "multi-select",
  "multiple": true,
  "options": [
    { "label": "Tag 1", "value": "tag1" },
    { "label": "Tag 2", "value": "tag2" }
  ]
}
```

### Number Filter

```json
{
  "id": "quantity",
  "label": "Quantity",
  "type": "number",
  "min": 0,
  "max": 100,
  "placeholder": "Enter quantity"
}
```

### Boolean Filter

```json
{
  "id": "available",
  "label": "Available",
  "type": "boolean",
  "defaultValue": false
}
```

### Range Filter (Future)

```json
{
  "id": "priceRange",
  "label": "Price Range",
  "type": "range",
  "min": 0,
  "max": 1000,
  "defaultValue": [0, 1000]
}
```

### Date Filter (Future)

```json
{
  "id": "date",
  "label": "Date",
  "type": "date"
}
```

## Configuration Options

### FilterConfig Interface

```typescript
interface FilterConfig {
  id: string; // Unique filter identifier
  label: string; // Display label
  type: FilterType; // Filter type
  placeholder?: string; // Placeholder text
  options?: FilterOption[]; // Options for select/multi-select
  min?: number; // Min value for number/range
  max?: number; // Max value for number/range
  defaultValue?: any; // Default filter value
  required?: boolean; // Is filter required
  multiple?: boolean; // Allow multiple selections
  clearable?: boolean; // Show clear button
}
```

## Creating Custom Filter Configurations

You can create multiple filter configuration files for different use cases:

```
assets/filters/
├── filter-config.json           # Default
├── product-filters.json         # Product listing filters
├── user-filters.json            # User management filters
└── report-filters.json          # Report filters
```

Then specify which config to load:

```html
<app-filter [configPath]="'assets/filters/product-filters.json'" />
```

## Adding New Filter Types

1. Create a new filter component in `ui/` folder
2. Add the filter type to `FilterType` enum
3. Import and add to `FilterComponent` template switch case
4. Update filter configuration JSON schema

## URL Serialization

The filter state is automatically serialized to a base64-encoded JSON string that can be shared via URL:

```typescript
// Generate shareable URL
const urlState = this.filterService.serializeToUrl();
const shareableUrl = `${window.location.origin}?filters=${urlState}`;

// Load filters from URL on page load
const urlParams = new URLSearchParams(window.location.search);
const filtersParam = urlParams.get('filters');
if (filtersParam) {
  this.filterService.deserializeFromUrl(filtersParam);
}
```

## Styling

All filter components use a consistent design system with Tailwind-inspired colors. Customize styles by modifying:

- `filter.component.scss` - Main container styles
- Individual filter component styles - Specific filter type styles

## Best Practices

1. **Keep filter IDs unique** across all filter groups
2. **Use meaningful filter IDs** that describe the data being filtered
3. **Group related filters** together for better UX
4. **Provide clear labels and placeholders**
5. **Set reasonable min/max values** for number and range filters
6. **Use defaultValue** for filters that should start with a specific value
7. **Enable clearable** for better user experience

## Example: Tactical Board Filters

```json
[
  {
    "id": "tactical",
    "name": "Tactical Filters",
    "filters": [
      {
        "id": "formation",
        "label": "Formation",
        "type": "select",
        "options": [
          { "label": "6-0", "value": "6-0" },
          { "label": "5-1", "value": "5-1" },
          { "label": "4-2", "value": "4-2" }
        ]
      },
      {
        "id": "playerCount",
        "label": "Players on Court",
        "type": "number",
        "min": 1,
        "max": 7,
        "defaultValue": 7
      },
      {
        "id": "showZones",
        "label": "Show Zones",
        "type": "boolean",
        "defaultValue": true
      }
    ]
  }
]
```
