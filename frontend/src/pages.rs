use leptos::prelude::*;
use leptos_meta::*;

#[component]
pub fn Home() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <Title text="Home - Loydon Resort" />
        <Meta name="description" content="Welcome to Loydon Resort - A fullstack Leptos application" />

        <header class="header">
            <div class="container">
                <h1 class="logo">"Loydon Resort"</h1>
                <nav class="nav">
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                </nav>
            </div>
        </header>

        <main>
            <div class="hero">
                <div class="container">
                    <h1>"Welcome to Loydon Resort"</h1>
                    <p>"Experience luxury with a fullstack Leptos + Axum application"</p>
                </div>
            </div>

            <div class="content">
                <div class="container">
                    <section class="features">
                        <h2>"Interactive SSR Example"</h2>
                        <p>"This page is rendered on the server (SSR) but still fully interactive!"</p>
                        
                        <div class="counter-demo">
                            <p class="counter-value">"Current Count: " <strong>{count}</strong></p>
                            <button 
                                class="btn btn-primary"
                                on:click=move |_| set_count.update(|c| *c += 1)
                            >
                                "Increment Counter"
                            </button>
                            <button 
                                class="btn btn-secondary"
                                on:click=move |_| set_count.set(0)
                            >
                                "Reset"
                            </button>
                        </div>
                    </section>

                    <section class="info">
                        <h2>"What is SSR?"</h2>
                        <ul>
                            <li>"Components are rendered on the server"</li>
                            <li>"HTML is sent to your browser"</li>
                            <li>"JavaScript hydrates the page for interactivity"</li>
                            <li>"Better SEO and initial load performance"</li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    }
}

#[component]
pub fn NotFound() -> impl IntoView {
    view! {
        <Title text="404 - Page Not Found" />
        
        <div class="container error-page">
            <h1>"404"</h1>
            <p>"The page you're looking for doesn't exist."</p>
            <a href="/" class="btn btn-primary">"Go Back Home"</a>
        </div>
    }
}
