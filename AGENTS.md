<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Share photo/video masonry and accessible media lightboxes through `MediaMasonry` so Party and Events use consistent media handling.
- Mount route-aware, reduced-motion-aware scroll reveals once in the root; exclude admin and dialogs so controls remain immediately usable.
- Keep hero video uploads on the existing `site-media` storage and `site_media` settings contract; expose the uploader directly in Homepage navigation for discoverability.
