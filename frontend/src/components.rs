use leptos::*;

#[component]
pub fn NotFound() -> impl IntoView {
    view! {
        <div class="container">
            <h1>"404 - Page Not Found"</h1>
            <p>"The page you're looking for doesn't exist."</p>
        </div>
    }
}
