import { ImageResponse } from 'next/og';

export const alt = 'ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #EEF5EE 0%, #FDF8F2 55%, #FCEEE5 100%)',
          color: '#2D2A26',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#FFFFFF',
              border: '2px solid #BCD0BE',
              borderRadius: '999px',
              padding: '10px 24px',
              fontSize: 22,
              fontWeight: 700,
              color: '#3F6240',
            }}
          >
            <span>🍲 Nền tảng Bếp Gia Đình & Dinh Dưỡng Chuẩn Việt Nam</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#B75B35',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '10px 22px',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <span>Chuẩn Viện Dinh Dưỡng (FCT)</span>
          </div>
        </div>

        {/* Center Brand & Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span style={{ fontSize: 84, fontWeight: 900, color: '#3F6240', letterSpacing: '-2px' }}>
              ĂN GÌ
            </span>
            <span style={{ fontSize: 84, fontWeight: 900, color: '#B75B35', letterSpacing: '-2px' }}>
              MOM
            </span>
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#2D2A26',
              lineHeight: 1.25,
              maxWidth: '980px',
            }}
          >
            Hôm nay nhà mình ăn gì? Ghép mâm cơm 3 món, thực đơn Giảm cân & Tập Gym chuẩn Calo
          </div>
        </div>

        {/* Bottom Feature Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              border: '2px solid #EADBC8',
              borderRadius: '20px',
              padding: '14px 24px',
              fontSize: 22,
              fontWeight: 700,
              color: '#3F6240',
            }}
          >
            🥗 Giảm cân · Ít Calo (≤ 500 kcal)
          </div>
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              border: '2px solid #EADBC8',
              borderRadius: '20px',
              padding: '14px 24px',
              fontSize: 22,
              fontWeight: 700,
              color: '#B75B35',
            }}
          >
            💪 Tập Gym · Tăng cơ (Giàu Protein)
          </div>
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              border: '2px solid #EADBC8',
              borderRadius: '20px',
              padding: '14px 24px',
              fontSize: 22,
              fontWeight: 700,
              color: '#5C4A3A',
            }}
          >
            🛒 Tự động cộng dồn đi chợ
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
