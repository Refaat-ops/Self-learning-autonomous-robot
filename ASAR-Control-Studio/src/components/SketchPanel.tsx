type SketchPanelProps = {
  fileName: string;
  sketch: string;
  onDownload: () => void;
};

export function SketchPanel({ fileName, sketch, onDownload }: SketchPanelProps) {
  return (
    <section className="panel stack-lg sketch-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Arduino Export</p>
          <h2>Generated sketch ready for Arduino IDE</h2>
        </div>
        <button className="primary-button" onClick={onDownload} type="button">
          Download {fileName}
        </button>
      </div>

      <div className="code-shell">
        <pre>{sketch}</pre>
      </div>
    </section>
  );
}