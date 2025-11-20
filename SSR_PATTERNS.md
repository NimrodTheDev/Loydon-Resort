# SSR Patterns and Best Practices

Learn how to build robust SSR applications with Leptos + Axum.

## 1. Server Functions (API Routes)

Server functions allow you to call Rust functions from the browser, automatically serializing data.

### Define a Server Function

In `frontend/src/lib.rs` or any module:

```rust
#[server]
pub async fn fetch_resort_data(id: String) -> Result<ResortData, ServerFnError> {
    // This code runs on the server
    let db = get_database_connection(); // Your database
    let resort = db.find_resort(&id).await?;
    Ok(resort)
}
```

### Use in a Component

```rust
#[component]
pub fn ResortDetail(id: String) -> impl IntoView {
    let resort = create_resource(
        move || id.clone(),
        |id| fetch_resort_data(id),
    );

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            {move || {
                resort.get().map(|resort_result| match resort_result {
                    Ok(data) => view! {
                        <h1>{&data.name}</h1>
                        <p>{&data.description}</p>
                    },
                    Err(err) => view! { <p>"Error: " {err.to_string()}</p> },
                })
            }}
        </Suspense>
    }
}
```

**Benefits**:

- ✅ Call Rust functions from browser
- ✅ Type-safe API calls
- ✅ Automatic serialization
- ✅ Works on server and client

## 2. Handling Form Submissions

### Create a Form Handler

```rust
#[server]
pub async fn book_room(
    guest_name: String,
    check_in: String,
    nights: i32,
) -> Result<BookingConfirmation, ServerFnError> {
    // Validate input
    if guest_name.is_empty() {
        return Err(ServerFnError::new("Name required"));
    }

    // Save to database
    let booking = Booking {
        guest_name,
        check_in: check_in.parse()?,
        nights,
    };

    let db = get_db();
    let id = db.create_booking(booking).await?;

    Ok(BookingConfirmation { booking_id: id })
}
```

### Use in Form Component

```rust
#[component]
pub fn BookingForm() -> impl IntoView {
    let book_action = create_action(|(data,): &(String, String, i32)| {
        let (name, date, nights) = (data[0].clone(), data[1].clone(), data[2] as i32);
        book_room(name, date, nights)
    });

    view! {
        <form on:submit=move |ev| {
            ev.prevent_default();
            book_action.dispatch((/* form values */));
        }>
            <input type="text" placeholder="Guest Name" />
            <input type="date" placeholder="Check-in" />
            <input type="number" placeholder="Nights" />
            <button type="submit">"Book Now"</button>
        </form>

        {move || {
            book_action.value().and_then(|result| {
                match result {
                    Ok(confirmation) => view! {
                        <p>"Booking confirmed: " {confirmation.booking_id}</p>
                    },
                    Err(err) => view! { <p>"Error: " {err.to_string()}</p> },
                }
            })
        }}
    }
}
```

## 3. Data Fetching Patterns

### Pattern A: Eager Loading (Load on Demand)

```rust
#[component]
pub fn ProductPage(id: String) -> impl IntoView {
    let product = create_resource(
        move || id.clone(),
        |id| async move { fetch_product(&id).await },
    );

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            // Show product when resource resolves
        </Suspense>
    }
}
```

**Use when**: Product pages, detail views, rarely-accessed content

### Pattern B: Preload (Load immediately)

```rust
#[component]
pub fn HomePage() -> impl IntoView {
    let featured = create_resource(
        || (),
        |_| async { fetch_featured_resorts().await },
    );

    view! {
        <div class="featured-section">
            // Featured resorts show immediately after render
        </div>
    }
}
```

**Use when**: Home page, critical content, always-visible sections

### Pattern C: Pagination

```rust
#[component]
pub fn ReviewsList(resort_id: String) -> impl IntoView {
    let (page, set_page) = create_signal(1);

    let reviews = create_resource(
        move || (resort_id.clone(), page()),
        |(id, page_num)| async move {
            fetch_reviews(&id, page_num).await
        },
    );

    view! {
        <div class="reviews">
            {move || {
                reviews.get().map(|result| match result {
                    Ok(data) => view! {
                        <ul>
                            {data.items.iter().map(|r| view! {
                                <li>{&r.text}</li>
                            }).collect_view()}
                        </ul>
                        <button on:click=move |_| set_page(page() - 1)>"Previous"</button>
                        <button on:click=move |_| set_page(page() + 1)>"Next"</button>
                    },
                    Err(_) => view! { <p>"Error loading reviews"</p> },
                })
            }}
        </div>
    }
}
```

**Use when**: Lists with many items, search results, galleries

## 4. Authentication & Authorization

### Server Function with Auth Check

```rust
#[server]
pub async fn get_user_bookings(user_id: String) -> Result<Vec<Booking>, ServerFnError> {
    // Verify user is authenticated
    let auth_user = get_authenticated_user()?;

    // Verify user is requesting their own data
    if auth_user.id != user_id {
        return Err(ServerFnError::new("Unauthorized"));
    }

    let db = get_db();
    let bookings = db.get_user_bookings(&user_id).await?;
    Ok(bookings)
}
```

### Protected Route Component

```rust
#[component]
pub fn MyBookings() -> impl IntoView {
    let user = create_resource(
        || (),
        |_| async { get_current_user().await },
    );

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            {move || {
                user.get().map(|result| match result {
                    Ok(Some(user)) => view! {
                        <h1>"Your Bookings"</h1>
                        <YourBookingsContent user={user} />
                    },
                    Ok(None) => view! {
                        <p>"Please log in to view your bookings"</p>
                        <a href="/login">"Login"</a>
                    },
                    Err(_) => view! { <p>"Error loading user"</p> },
                })
            }}
        </Suspense>
    }
}
```

## 5. Error Handling

### Server Function Error Handling

```rust
#[server]
pub async fn update_profile(
    name: String,
    email: String,
) -> Result<Profile, ServerFnError> {
    // Validate input
    if name.len() < 2 {
        return Err(ServerFnError::new("Name too short"));
    }

    if !email.contains('@') {
        return Err(ServerFnError::new("Invalid email"));
    }

    // Database operation
    let db = get_db();
    match db.update_profile(&name, &email).await {
        Ok(profile) => Ok(profile),
        Err(db_err) => {
            tracing::error!("DB error: {}", db_err);
            Err(ServerFnError::new("Failed to update profile"))
        }
    }
}
```

### Error Display in Component

```rust
#[component]
pub fn ProfileForm() -> impl IntoView {
    let update_action = create_action(|data: &(String, String)| {
        let (name, email) = data.clone();
        update_profile(name, email)
    });

    view! {
        <form on:submit=move |ev| {
            ev.prevent_default();
            let name = /* get from input */;
            let email = /* get from input */;
            update_action.dispatch((name, email));
        }>
            // Form fields...
        </form>

        {move || {
            update_action.value().and_then(|result| {
                match result {
                    Ok(profile) => view! {
                        <div class="success">
                            "Profile updated: " {profile.name}
                        </div>
                    },
                    Err(error) => view! {
                        <div class="error">
                            "Error: " {error.to_string()}
                        </div>
                    },
                }
            })
        }}
    }
}
```

## 6. State Management

### Leptos Signals (Simple State)

```rust
#[component]
pub fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <p>"Count: " {count}</p>
        <button on:click=move |_| set_count.update(|c| *c += 1)>
            "Increment"
        </button>
    }
}
```

### Derived Signals (Computed)

```rust
let doubled = move || count() * 2;

view! {
    <p>"Count: " {count}</p>
    <p>"Doubled: " {doubled()}</p>
}
```

### Memos (Expensive Computations)

```rust
let expensive_calculation = create_memo(move || {
    // Only runs when dependencies change
    heavy_computation(count())
});

view! {
    <p>"Result: " {expensive_calculation()}</p>
}
```

## 7. SEO Best Practices

### Meta Tags for Each Page

```rust
#[component]
pub fn ProductDetail(id: String) -> impl IntoView {
    let product = create_resource(
        move || id.clone(),
        |id| async move { fetch_product(&id).await },
    );

    view! {
        {move || {
            product.get().map(|result| match result {
                Ok(product) => view! {
                    <Title text={format!("{} - Loydon Resort", &product.name)} />
                    <Meta name="description" content={product.description.clone()} />
                    <Meta property="og:image" content={product.image_url.clone()} />
                    <Meta property="og:title" content={product.name.clone()} />

                    <h1>{&product.name}</h1>
                    // Product content
                },
                Err(_) => view! {
                    <Title text="Product Not Found" />
                    <p>"Product not found"</p>
                },
            })
        }}
    }
}
```

### Structured Data (JSON-LD)

```rust
#[component]
pub fn ResortPage() -> impl IntoView {
    let schema = r#"
    {
        "@context": "https://schema.org/",
        "@type": "Hotel",
        "name": "Loydon Resort",
        "description": "Luxury resort",
        "image": "https://example.com/image.jpg",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Resort Way",
            "addressLocality": "Paradise",
            "postalCode": "12345"
        }
    }
    "#;

    view! {
        <script type="application/ld+json">
            {schema}
        </script>
    }
}
```

## 8. Performance Tips

### 1. Use Resource for Async Data

```rust
// Good - Resources handle loading state
let data = create_resource(|| (), |_| fetch_data());

// Avoid - Manual effect + signal
let (data, set_data) = create_signal(None);
create_effect(move |_| {
    spawn_local(async {
        set_data(Some(fetch_data().await));
    });
});
```

### 2. Cache API Responses

In `backend/src/main.rs`:

```rust
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

let cache: Arc<Mutex<HashMap<String, CachedData>>> = Arc::new(Mutex::new(HashMap::new()));

axum::Router::new()
    .route("/api/featured", get(move |State(cache)| {
        // Check cache before querying database
        if let Some(cached) = cache.lock().unwrap().get("featured") {
            return cached.clone();
        }
        // Otherwise fetch and cache
    }))
```

### 3. Stream Large Responses

```rust
// Instead of loading entire dataset
let all_items = fetch_all_items(); // Could be millions

// Use pagination
let items = fetch_items_paginated(page, limit);
```

### 4. Minimize JavaScript

- Only include interactive components
- Server-render static content
- Use lazy loading for off-screen content

## Common Gotchas

### 1. Hydration Mismatch

**Problem**: Server renders one thing, client renders differently

```rust
// ❌ Bad - random on server
let is_odd = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() % 2 == 0;

// ✅ Good - deterministic
let (count, set_count) = create_signal(0);
```

### 2. Using Client-Only APIs Server-Side

```rust
// ❌ Bad - window not available on server
let window = web_sys::window().unwrap();

// ✅ Good - feature gate
#[cfg(target_arch = "wasm32")]
let window = web_sys::window().unwrap();
```

### 3. Not Awaiting Server Functions

```rust
// ❌ Bad - forgot to await
let result = fetch_data();

// ✅ Good - properly awaited
let result = fetch_data().await;
```

## Debugging Tips

### Enable Debug Logging

```bash
RUST_LOG=debug cargo run --package backend --features ssr
```

### Check Server Rendering

Inspect page source (Cmd+U on Mac):

- Should see fully rendered HTML
- Should include `<script>` tags for hydration

### Browser Console

Look for:

- Hydration errors
- Missing resources
- JavaScript errors during interaction

## Summary

**Key Patterns**:

1. Use `create_resource` for data fetching
2. Use `create_action` for form submissions
3. Use `#[server]` for type-safe API calls
4. Use `Suspense` for loading states
5. Use `leptos_meta` for SEO

**Best Practices**:

1. Keep server functions pure
2. Handle errors explicitly
3. Cache when possible
4. Minimize client JavaScript
5. Validate input on server

Happy building! 🚀
