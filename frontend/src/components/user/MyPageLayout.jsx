import MyPageSidebar from "./MyPageSidebar";

export default function MyPageLayout({ eyebrow, title, description, children }) {
  const hasHead = eyebrow || title || description;

  return (
    <div className="container page-stack">
      <section className="my-page-shell">
        <MyPageSidebar />
        <div className="my-page-main">
          {hasHead ? (
            <section className="my-page-head">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              {title ? <h1>{title}</h1> : null}
              {description ? <p>{description}</p> : null}
            </section>
          ) : null}
          <section className="my-page-panel">{children}</section>
        </div>
      </section>
    </div>
  );
}
