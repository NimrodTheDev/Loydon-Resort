use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use leptos::prelude::*;
use leptos_axum::{LeptosRoutes, generate_route_list};
use shared::Message;
use std::sync::Arc;
use tower_http::compression::CompressionLayer;
use tracing_subscriber;

mod api;

#[derive(Clone)]
pub struct AppState {
    // Add your application state here
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let state = AppState {};

    // Load Leptos configuration from environment
    let conf = leptos::prelude::get_configuration(None).await?;
    let leptos_options = conf.leptos_options;
    let routes = generate_route_list(frontend::App);

    // Build our application with SSR
    let app = Router::new()
        .route("/api/hello", get(hello_handler))
        .route("/api/message", post(message_handler))
        .leptos_routes(&leptos_options, routes, frontend::App)
        .layer(CompressionLayer::new())
        .with_state(state)
        .fallback(leptos_axum::file_and_error_handler::<frontend::App>.with_state(leptos_options));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    tracing::info!("🚀 Server running at http://127.0.0.1:3000");

    axum::serve(listener, app).await?;

    Ok(())
}

async fn hello_handler(State(_state): State<AppState>) -> Json<Message> {
    Json(Message::new("Hello from Axum!"))
}

async fn message_handler(
    State(_state): State<AppState>,
    Json(msg): Json<Message>,
) -> Json<Message> {
    tracing::info!("Received message: {}", msg.content);
    Json(Message::new(format!("Echo: {}", msg.content)))
}
