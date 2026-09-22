## Arch
* FE - potentially React & Vite + Tailwind and also a react based graph visualization library
* Fast API as BFF
* Database - initially indexdb which is device and domain specific for MVP, but then expand to postgres and sqlalchemy or some other ORM
* Auth - google auth
* Model - Gemini to stay with GCP for now, but we can make it generic in the long-term to use Claude and OpenAI as well.
* for protoocol, for now we can start with Rest, we can decide between gRPC and GraphQL later, we don't need masking, super efficient protocols for the dmeo.Fo