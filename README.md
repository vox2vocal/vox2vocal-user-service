# Vox2Vocal User Service

사용자 도메인 gRPC 서비스입니다.

## 역할

- 사용자 도메인 로직 처리
- PostgreSQL 데이터 소유
- Prisma 기반 DB 접근
- `api-gateway`에서 gRPC로 호출

## 포트

- HTTP health: `3002`
- gRPC: `50051`

## 실행

```bash
npm install
npm run prisma:generate
npm run start:dev
```
