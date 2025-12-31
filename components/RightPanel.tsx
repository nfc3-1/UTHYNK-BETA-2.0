export default function RightPanel(){
  return (
    <div>
      <div className="ppInfoTitle">💡 Did You Know?</div>
      <div className="ppInfoCard">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
          <div className="smallMuted">Quick facts to sharpen thinking</div>
          <div className="smallMuted" style={{fontSize:12}}>See more</div>
        </div>

        <div className="ppBullets">
          <div className="ppBullet">
            <div className="ppBulletDot">•</div>
            <div>A cognitive bias called the <b>Halo Effect</b> makes us overrate people we already like.</div>
          </div>
          <div className="ppBullet">
            <div className="ppBulletDot">•</div>
            <div>Ancient Greece had a version of jury duty. Citizens used colored disks to vote on verdicts.</div>
          </div>
          <div className="ppBullet">
            <div className="ppBulletDot">•</div>
            <div><b>Mandela Effect</b>: many remember “Berenstein Bears” as the spelling, but it’s “Berenstain Bears”.</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop: 14}}>
        <div className="ppInfoTitle" style={{margin:0}}>Daily Trivia</div>
        <div className="smallMuted" style={{fontSize:12}}>See more</div>
      </div>
      <div className="ppTrivia ppInfoCard" style={{marginTop: 8}}>
        <div className="ppThumb" />
        <div style={{fontSize:13, color:'rgba(255,255,255,0.86)', lineHeight:1.35}}>
          Socrates could have escaped the seat he was sentenced to, but chose to drink the hemlock anyway—he taught that obeying the law was part of civic duty.
        </div>
      </div>
    </div>
  );
}
