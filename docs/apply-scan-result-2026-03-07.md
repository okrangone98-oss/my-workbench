# Apply Scan Result

- 기준 스캔 파일: `G:\my-work-bench\data\folder-scan-2026-03-07.json`
- 적용 모드: `apply`
- 생성일: `2026-03-07T06:49:01.013Z`

| source | target | state | bucket | reason |
| --- | --- | --- | --- | --- |
| `G:\tmp` | `G:\최근3개월검토\자동분류\tmp` | `MOVE` | `review-candidate` | `cache_or_temp_folder` |

## Safety Rules

- `G:\` 바로 아래 1depth 폴더만 이동한다.
- 보호 폴더(`과거자료`, `장기보관자료`, `정리운영로그`, `진행중프로젝트`, `최근3개월검토`, `my-work-bench`)는 이동하지 않는다.
- 대상 경로가 이미 존재하면 건너뛴다.
- 대상 경로가 소스 경로 내부이면 건너뛴다.
