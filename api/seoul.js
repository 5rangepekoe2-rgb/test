export default async function handler(req, res) {
  const key = String(req.query?.key || 'sample').trim();
  const url = `http://openAPI.seoul.go.kr:8088/${encodeURIComponent(key)}/json/ListPublicReservationEducation/1/100/`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SeoulReservationPractice/1.0' }
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({ ok: false, error: `Seoul API HTTP ${response.status}`, raw: text.slice(0, 500) });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ ok: false, error: '서울시 API 응답이 JSON 형식이 아닙니다.', raw: text.slice(0, 500) }); }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || '서울시 API 호출 실패' });
  }
}
