# 거리 한눈에

출발지와 도착지를 검색해 자동차 경로 거리를 확인하는 한국어 웹앱입니다.

## 실행 및 배포

저장소를 GitHub에 올린 다음 Vercel에서 해당 저장소를 Import하면 됩니다. 빌드 명령이나 환경변수, Redis 설정은 필요하지 않습니다. Vercel이 `api/` 아래의 서버리스 함수와 정적 파일을 자동으로 배포합니다.

로컬에서 확인하려면 Vercel CLI를 사용해 프로젝트 폴더에서 `vercel dev`를 실행하세요.

## 데이터 제공처

- 장소 검색: [OpenStreetMap Nominatim](https://nominatim.org/)
- 자동차 경로 및 거리: [OSRM 공개 데모 서버](https://project-osrm.org/)
- 지도 링크: [OpenStreetMap](https://www.openstreetmap.org/)

장소는 검색 버튼을 눌렀을 때 조회하며, 검색 결과에서 위치를 선택해야 거리를 계산할 수 있습니다. 공개 데이터 서비스는 사용 정책과 용량 제한이 있으며, OSRM 데모 서버는 서비스 수준을 보장하지 않습니다. 사용량이 많은 서비스나 안정성 보장이 필요한 서비스에는 전용 지오코딩·경로 서비스 사용을 검토하세요.
