use leptos::prelude::*;
use leptos_meta::*;
use leptos_router::*;

pub mod pages;
pub mod components;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <Html attr:lang="en" attr:dir="ltr" attr:data-theme="light" />
        <Title text="Loydon Resort" />
        <Meta charset="UTF-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <main>
            <Router>
                <Routes>
                    <Route path="/" view=pages::Home />
                    <Route path="/*" view=pages::NotFound />
                </Routes>
            </Router>
        </main>
    }
}

#[cfg(feature = "hydrate")]
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn hydrate() {
    use leptos::prelude::*;

    console_error_panic_hook::set_once();
    wasm_logger::init(wasm_logger::Config::default());

    leptos::mount_to_body(|| {
        view! { <App /> }
    });
}
