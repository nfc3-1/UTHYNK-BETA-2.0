'use client';

type ContentQueueProps = {
  isGenerating: boolean;
  generationSource: 'openai' | 'fallback' | null;
  onGenerate: () => void;
};

export default function ContentQueue({ isGenerating, generationSource, onGenerate }: ContentQueueProps) {
  return (
    <div className="studioApprovalBox">
      <p>Build a full week from the selected campaign goal. Studio calls the secured generation route, validates the JSON, then puts drafts into review.</p>
      <button className="btn btnPrimary" type="button" onClick={onGenerate} disabled={isGenerating}>{isGenerating ? 'Building Campaign...' : 'Generate The Week'}</button>
      {generationSource && <p className="studioMuted studioInlineNote">Last generation source: {generationSource === 'openai' ? 'AI generation route' : 'local backup draft'}.</p>}
    </div>
  );
}
