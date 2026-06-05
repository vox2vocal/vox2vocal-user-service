# User Service Agent Index

`user-service`에서 테스트 코드를 작성하거나 수정하는 에이전트는 먼저 아래 가이드를 확인한다.

- [User Service Testing Guide](../docs/testing/user-service-testing-guide.md)

핵심 규칙:

- CQRS command/query handler를 유스케이스 테스트의 중심으로 둔다.
- handler unit test에서는 `jest-mock-extended`로 repository, hash service, policy 등 dependency를 mock한다.
- Prisma repository 검증은 실제 테스트 DB를 사용하는 integration test로 분리한다.
- controller test는 gRPC request 변환, CommandBus/QueryBus 호출, response mapping만 검증한다.
- policy와 mapper는 Nest TestingModule 없이 순수 unit test로 작성한다.
- gRPC/protobuf contract, ConfigModule/env, Argon2 security, Prisma lifecycle 관점을 테스트 설계에 포함한다.
- PowerShell에서는 `npm` 대신 `npm.cmd`를 사용한다.

검증 명령:

```bash
npm.cmd test -- --runInBand
npm.cmd run verify
```
