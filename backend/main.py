from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from routers import tournaments, users, feedback

app = FastAPI(
    title="Tournament Manager API",
    description="API per la gestione di tornei sportivi.",
    version="0.1.0",
)

@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response = await call_next(request)
    if request.method == "GET":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.37:3000",
    "http://192.168.3.62:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use allow_origins to respect the origins list
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments.router, prefix="/api/tournaments", tags=["tournaments"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
