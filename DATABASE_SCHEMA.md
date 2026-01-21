# Database Schema Documentation

## Overview

This document describes the database schema for the HotelExpress application (Loydon Resort). The database uses PostgreSQL with multiple schemas to organize related tables.

## Database Schemas

The database is organized into the following schemas:
- `hotel` - Hotel information, rooms, and categories
- `booking` - Booking and reservation data
- `event` - (Reserved for future use)
- `billing` - (Reserved for future use)

---

## Schema: `hotel`

### Table: `hotel_info`

Stores the hotel's basic information. Typically contains a single record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(150) | NOT NULL | Hotel name |
| `street` | TEXT | NOT NULL | Street address |
| `city` | VARCHAR(100) | | City name |
| `state` | VARCHAR(100) | | State/province |
| `country` | VARCHAR(100) | | Country |
| `zip` | VARCHAR(20) | | Postal/ZIP code |
| `phone` | VARCHAR(30) | | Contact phone number |
| `email` | VARCHAR(150) | | Contact email |
| `website` | VARCHAR(150) | | Website URL |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

---

### Table: `amenities`

Stores available amenities that can be associated with room categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Amenity name (e.g., "Television", "A/C", "Shower") |

**Seed Data Includes:**
- Television
- Fan
- A/C
- Shower
- 3 socket spots
- Clothes rack
- Drawer
- Bed size for 1
- Bed size for 2
- Bed size for 3
- Extra space

---

### Table: `room_categories`

Defines different types of rooms (Standard, Deluxe, Suite) with their characteristics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Category name (e.g., "Standard", "Deluxe", "Suite") |
| `short_description` | TEXT | | Brief description of the room category |
| `price` | INTEGER | NOT NULL | Price per night (in smallest currency unit) |
| `icon_svg` | TEXT | | SVG icon for the room category |
| `amenity_ids` | UUID[] | DEFAULT '{}' | Array of amenity IDs associated with this category |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Seed Data:**
- **Standard** - Price: 7000, 8 amenities
- **Deluxe** - Price: 9000, 8 amenities
- **Suite** - Price: 10000, 9 amenities

**Relationship:**
- Contains an array of `amenity_ids` that references `hotel.amenities.id` (many-to-many relationship, stored as array)

---

### Table: `rooms`

Stores individual physical rooms in the hotel.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `room_number` | INTEGER | UNIQUE, NOT NULL | Physical room number (e.g., 201, 302) |
| `room_category_id` | UUID | NOT NULL, FOREIGN KEY | References `hotel.room_categories.id` |
| `floor` | INTEGER | | Floor number (derived from room_number) |
| `is_active` | BOOLEAN | DEFAULT true | Whether the room is available for booking |

**Relationships:**
- **Many-to-One** with `hotel.room_categories` via `room_category_id`

**Seed Data Examples:**
- Standard rooms: 201, 202, 203, 204, 205, 206, 303, 304, 305, 306
- Deluxe rooms: 301, 308, 309
- Suite: 302

---

## Schema: `booking`

### Table: `bookings`

Stores guest booking information and reservations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `guest_name` | VARCHAR(150) | NOT NULL | Guest's full name |
| `guest_email` | VARCHAR(150) | NOT NULL | Guest's email address |
| `guest_phone` | VARCHAR(30) | | Guest's phone number |
| `room_ids` | UUID[] | NOT NULL | Array of room IDs being booked |
| `check_in_date` | DATE | NOT NULL | Check-in date |
| `check_out_date` | DATE | NOT NULL | Check-out date |
| `total_price` | INTEGER | NOT NULL | Total booking price |
| `status` | VARCHAR(50) | DEFAULT 'pending' | Booking status |
| `booking_code` | VARCHAR(10) | UNIQUE | Unique booking code (e.g., "HXL-XXXXXX") |
| `check_in_status` | VARCHAR(20) | DEFAULT 'pending' | Check-in status ('pending' or 'checked_in') |
| `checked_in_at` | TIMESTAMP | | Timestamp when guest checked in |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Booking creation timestamp |

**Relationships:**
- **Many-to-Many** with `hotel.rooms` via `room_ids` array (contains UUIDs referencing `hotel.rooms.id`)

**Booking Code Format:**
- Prefix: "HXL-"
- Followed by 6 alphanumeric characters
- Example: "HXL-A1B2C3"

---

## Entity Relationship Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOTEL SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   hotel_info         │
│  (Singleton)         │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ street               │
│ city                 │
│ state                │
│ country              │
│ zip                  │
│ phone                │
│ email                │
│ website              │
│ created_at           │
└──────────────────────┘


┌──────────────────────┐         ┌──────────────────────┐
│   amenities          │         │  room_categories     │
├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │         │ id (PK)              │
│ name (UNIQUE)        │         │ name (UNIQUE)        │
└──────────────────────┘         │ short_description    │
                                 │ price                │
                                 │ icon_svg             │
         ┌───────────────────────│ amenity_ids[]        │◄───┐
         │                       │ created_at           │    │
         │                       └──────────────────────┘    │
         │                          ▲                         │
         │                          │                         │
         │                          │ FK                      │
         │                          │ room_category_id        │
         │                          │                         │
         │                  ┌───────┴───────┐                │
         │                  │    rooms      │                │
         │                  ├───────────────┤                │
         │                  │ id (PK)       │                │
         │                  │ room_number   │                │
         │                  │ room_category_│                │
         │                  │   id (FK)     │                │
         │                  │ floor         │                │
         │                  │ is_active     │                │
         │                  └───────────────┘                │
         │                                                   │
         │ (Many-to-Many via array)                          │
         └───────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         BOOKING SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│    bookings          │
├──────────────────────┤
│ id (PK)              │
│ guest_name           │
│ guest_email          │
│ guest_phone          │
│ room_ids[]           │──────────┐
│ check_in_date        │          │
│ check_out_date       │          │
│ total_price          │          │
│ status               │          │
│ booking_code (UNIQUE)│          │
│ check_in_status      │          │
│ checked_in_at        │          │
│ created_at           │          │
└──────────────────────┘          │
                                  │
                                  │ (Many-to-Many)
                                  │ References hotel.rooms.id
                                  │
                                  ▼
                          ┌──────────────────────┐
                          │    hotel.rooms       │
                          └──────────────────────┘
```

---

## Relationship Summary

### One-to-Many Relationships

1. **`hotel.room_categories` → `hotel.rooms`**
   - One category can have many rooms
   - Foreign Key: `hotel.rooms.room_category_id` → `hotel.room_categories.id`

### Many-to-Many Relationships (via Arrays)

1. **`hotel.room_categories` ↔ `hotel.amenities`**
   - One category can have many amenities
   - One amenity can belong to many categories
   - Stored as: `hotel.room_categories.amenity_ids[]` contains `hotel.amenities.id` values

2. **`booking.bookings` ↔ `hotel.rooms`**
   - One booking can include many rooms
   - One room can be part of many bookings (over time)
   - Stored as: `booking.bookings.room_ids[]` contains `hotel.rooms.id` values

### Notes on Array-Based Relationships

- PostgreSQL arrays (`UUID[]`) are used for many-to-many relationships
- This approach provides flexibility but requires application-level integrity checks
- No foreign key constraints are enforced on array elements
- Queries use `ANY()` operator: `WHERE amenity_id = ANY(amenity_ids)`

---

## Indexes and Constraints

### Primary Keys
- All tables use UUID primary keys with `gen_random_uuid()` as default
- Ensures distributed uniqueness without coordination

### Unique Constraints
- `hotel.amenities.name` - Each amenity name must be unique
- `hotel.room_categories.name` - Each category name must be unique
- `hotel.rooms.room_number` - Each room number must be unique
- `booking.bookings.booking_code` - Each booking code must be unique

### Foreign Key Constraints
- `hotel.rooms.room_category_id` → `hotel.room_categories.id`
  - Ensures every room belongs to a valid category
  - Prevents deletion of categories with existing rooms

---

## Data Flow

### Booking Process

1. **Guest browses rooms** → Queries `hotel.room_categories` and `hotel.rooms`
2. **Guest selects room(s)** → Gets room IDs
3. **Guest creates booking** → Inserts into `booking.bookings` with:
   - Guest information
   - Selected `room_ids[]`
   - Dates and pricing
   - Auto-generated `booking_code`
4. **Check-in process** → Updates `check_in_status` and `checked_in_at` using `booking_code`

### Room Availability

- Rooms are filtered by `is_active = true`
- Availability is determined by checking existing bookings for date conflicts
- The application handles availability logic (not enforced at DB level)

---

## Future Considerations

### Reserved Schemas
- `event` schema - For future event management features
- `billing` schema - For future billing and payment tracking

### Potential Improvements
1. **Date-based availability**: Add booking date overlap checks at DB level
2. **Payment tracking**: Link bookings to payments in `billing` schema
3. **Audit trail**: Add update timestamps and soft delete support
4. **Normalization**: Consider junction tables for many-to-many relationships if referential integrity becomes critical

---

## Query Patterns

### Getting Rooms with Amenities
```sql
SELECT rc.*, array_agg(a.name) as amenities
FROM hotel.room_categories rc
LEFT JOIN hotel.amenities a ON a.id = ANY(rc.amenity_ids)
GROUP BY rc.id;
```

### Getting Available Rooms for a Category
```sql
SELECT r.*
FROM hotel.rooms r
WHERE r.room_category_id = $1
  AND r.is_active = true;
```

### Finding Bookings for a Room
```sql
SELECT b.*
FROM booking.bookings b
WHERE $1 = ANY(b.room_ids);
```

---

*Generated: HotelExpress Database Schema Documentation*
