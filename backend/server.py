from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Models =============

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "donor"  # admin or donor

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Family Models
class Family(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    members_count: int
    description: str
    monthly_need: float
    current_sponsors: int = 0
    image: Optional[str] = None
    status: str = "active"  # active, sponsored
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FamilyCreate(BaseModel):
    name: str
    members_count: int
    description: str
    monthly_need: float
    image: Optional[str] = None

# Donation Models
class Donation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donor_id: str
    donor_name: str
    type: str  # family, health, material, education
    target_id: Optional[str] = None  # ID of family/health_case/etc
    amount: Optional[float] = None
    items: Optional[str] = None  # For material donations
    message: Optional[str] = None
    status: str = "pending"  # pending, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DonationCreate(BaseModel):
    type: str
    target_id: Optional[str] = None
    amount: Optional[float] = None
    items: Optional[str] = None
    message: Optional[str] = None

# Health Case Models
class HealthCase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_name: str
    age: int
    condition: str
    required_amount: float
    collected_amount: float = 0.0
    description: str
    image: Optional[str] = None
    status: str = "active"  # active, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthCaseCreate(BaseModel):
    patient_name: str
    age: int
    condition: str
    required_amount: float
    description: str
    image: Optional[str] = None

# Initiative Models
class Initiative(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    date: str
    volunteers_needed: int
    current_volunteers: int = 0
    status: str = "upcoming"  # upcoming, ongoing, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InitiativeCreate(BaseModel):
    title: str
    description: str
    date: str
    volunteers_needed: int

# Course Models  
class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str  # awareness, education
    description: str
    date: str
    duration: str
    max_participants: int
    current_participants: int = 0
    instructor: Optional[str] = None
    status: str = "upcoming"  # upcoming, ongoing, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CourseCreate(BaseModel):
    title: str
    category: str
    description: str
    date: str
    duration: str
    max_participants: int
    instructor: Optional[str] = None

# Project Models
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    required_funding: float
    collected_funding: float = 0.0
    family_id: Optional[str] = None
    status: str = "funding"  # funding, running, completed
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    required_funding: float
    family_id: Optional[str] = None
    image: Optional[str] = None

# Success Story Models
class SuccessStory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuccessStoryCreate(BaseModel):
    title: str
    description: str
    image: Optional[str] = None

# Mission Content Models
class MissionContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "mission_content"  # Single document ID
    vision_text: str
    vision_highlight: str
    vision_image: Optional[str] = None  # Base64 image or URL
    principles: List[dict]  # [{icon, title, description}]
    old_model: List[str]
    new_model: List[str]
    testimonials: List[dict]  # [{name, role, text}]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MissionContentUpdate(BaseModel):
    vision_text: Optional[str] = None
    vision_highlight: Optional[str] = None
    vision_image: Optional[str] = None
    principles: Optional[List[dict]] = None
    old_model: Optional[List[str]] = None
    new_model: Optional[List[str]] = None
    testimonials: Optional[List[dict]] = None

# Hero Section Models
class HeroContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "hero_content"
    title: str
    subtitle: str
    cta_text: str
    cta_link: str
    background_image: Optional[str] = None  # Base64 image or URL
    quotes: List[dict]  # [{text, ref, author}]
    video_url: Optional[str] = None
    video_title: Optional[str] = None
    video_description: Optional[str] = None
    video_subtitle: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HeroContentUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    background_image: Optional[str] = None
    quotes: Optional[List[dict]] = None
    video_url: Optional[str] = None
    video_title: Optional[str] = None
    video_description: Optional[str] = None
    video_subtitle: Optional[str] = None

# ============= Helper Functions =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# ============= Auth Routes =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_input: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_input.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_input.model_dump()
    user_dict['password'] = get_password_hash(user_dict['password'])
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password'})
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = user_dict['password']
    
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username}, {"_id": 0})
    if not user or not verify_password(form_data.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= Family Routes =============

@api_router.get("/families", response_model=List[Family])
async def get_families():
    families = await db.families.find({}, {"_id": 0}).to_list(1000)
    for family in families:
        if isinstance(family['created_at'], str):
            family['created_at'] = datetime.fromisoformat(family['created_at'])
    return families

@api_router.get("/families/{family_id}", response_model=Family)
async def get_family(family_id: str):
    family = await db.families.find_one({"id": family_id}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    if isinstance(family['created_at'], str):
        family['created_at'] = datetime.fromisoformat(family['created_at'])
    return Family(**family)

@api_router.post("/families", response_model=Family)
async def create_family(family_input: FamilyCreate, admin: User = Depends(get_admin_user)):
    family_dict = family_input.model_dump()
    family_obj = Family(**family_dict)
    
    doc = family_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.families.insert_one(doc)
    return family_obj

@api_router.put("/families/{family_id}", response_model=Family)
async def update_family(family_id: str, family_input: FamilyCreate, admin: User = Depends(get_admin_user)):
    existing = await db.families.find_one({"id": family_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Family not found")
    
    update_data = family_input.model_dump()
    await db.families.update_one({"id": family_id}, {"$set": update_data})
    
    updated = await db.families.find_one({"id": family_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Family(**updated)

@api_router.delete("/families/{family_id}")
async def delete_family(family_id: str, admin: User = Depends(get_admin_user)):
    result = await db.families.delete_one({"id": family_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Family not found")
    return {"message": "Family deleted successfully"}

# ============= Health Cases Routes =============

@api_router.get("/health-cases", response_model=List[HealthCase])
async def get_health_cases():
    cases = await db.health_cases.find({}, {"_id": 0}).to_list(1000)
    for case in cases:
        if isinstance(case['created_at'], str):
            case['created_at'] = datetime.fromisoformat(case['created_at'])
    return cases

@api_router.get("/health-cases/{case_id}", response_model=HealthCase)
async def get_health_case(case_id: str):
    case = await db.health_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Health case not found")
    if isinstance(case['created_at'], str):
        case['created_at'] = datetime.fromisoformat(case['created_at'])
    return HealthCase(**case)

@api_router.post("/health-cases", response_model=HealthCase)
async def create_health_case(case_input: HealthCaseCreate, admin: User = Depends(get_admin_user)):
    case_dict = case_input.model_dump()
    case_obj = HealthCase(**case_dict)
    
    doc = case_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.health_cases.insert_one(doc)
    return case_obj

@api_router.put("/health-cases/{case_id}", response_model=HealthCase)
async def update_health_case(case_id: str, case_input: HealthCaseCreate, admin: User = Depends(get_admin_user)):
    existing = await db.health_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Health case not found")
    
    update_data = case_input.model_dump()
    await db.health_cases.update_one({"id": case_id}, {"$set": update_data})
    
    updated = await db.health_cases.find_one({"id": case_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return HealthCase(**updated)

@api_router.delete("/health-cases/{case_id}")
async def delete_health_case(case_id: str, admin: User = Depends(get_admin_user)):
    result = await db.health_cases.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Health case not found")
    return {"message": "Health case deleted successfully"}

# ============= Initiatives Routes =============

@api_router.get("/initiatives", response_model=List[Initiative])
async def get_initiatives():
    initiatives = await db.initiatives.find({}, {"_id": 0}).to_list(1000)
    for init in initiatives:
        if isinstance(init['created_at'], str):
            init['created_at'] = datetime.fromisoformat(init['created_at'])
    return initiatives

@api_router.post("/initiatives", response_model=Initiative)
async def create_initiative(init_input: InitiativeCreate, admin: User = Depends(get_admin_user)):
    init_dict = init_input.model_dump()
    init_obj = Initiative(**init_dict)
    
    doc = init_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.initiatives.insert_one(doc)
    return init_obj

@api_router.put("/initiatives/{init_id}", response_model=Initiative)
async def update_initiative(init_id: str, init_input: InitiativeCreate, admin: User = Depends(get_admin_user)):
    existing = await db.initiatives.find_one({"id": init_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    update_data = init_input.model_dump()
    await db.initiatives.update_one({"id": init_id}, {"$set": update_data})
    
    updated = await db.initiatives.find_one({"id": init_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Initiative(**updated)

@api_router.delete("/initiatives/{init_id}")
async def delete_initiative(init_id: str, admin: User = Depends(get_admin_user)):
    result = await db.initiatives.delete_one({"id": init_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return {"message": "Initiative deleted successfully"}

# ============= Courses Routes =============

@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    for course in courses:
        if isinstance(course['created_at'], str):
            course['created_at'] = datetime.fromisoformat(course['created_at'])
    return courses

@api_router.post("/courses", response_model=Course)
async def create_course(course_input: CourseCreate, admin: User = Depends(get_admin_user)):
    course_dict = course_input.model_dump()
    course_obj = Course(**course_dict)
    
    doc = course_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.courses.insert_one(doc)
    return course_obj

@api_router.put("/courses/{course_id}", response_model=Course)
async def update_course(course_id: str, course_input: CourseCreate, admin: User = Depends(get_admin_user)):
    existing = await db.courses.find_one({"id": course_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course_input.model_dump()
    await db.courses.update_one({"id": course_id}, {"$set": update_data})
    
    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Course(**updated)

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, admin: User = Depends(get_admin_user)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

# ============= Projects Routes =============

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
    return projects

@api_router.post("/projects", response_model=Project)
async def create_project(project_input: ProjectCreate, admin: User = Depends(get_admin_user)):
    project_dict = project_input.model_dump()
    project_obj = Project(**project_dict)
    
    doc = project_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.projects.insert_one(doc)
    return project_obj

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_input: ProjectCreate, admin: User = Depends(get_admin_user)):
    existing = await db.projects.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_input.model_dump()
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Project(**updated)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, admin: User = Depends(get_admin_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# ============= Success Stories Routes =============

@api_router.get("/stories", response_model=List[SuccessStory])
async def get_stories():
    stories = await db.stories.find({}, {"_id": 0}).to_list(1000)
    for story in stories:
        if isinstance(story['created_at'], str):
            story['created_at'] = datetime.fromisoformat(story['created_at'])
    return stories

@api_router.post("/stories", response_model=SuccessStory)
async def create_story(story_input: SuccessStoryCreate, admin: User = Depends(get_admin_user)):
    story_dict = story_input.model_dump()
    story_obj = SuccessStory(**story_dict)
    
    doc = story_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.stories.insert_one(doc)
    return story_obj

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, admin: User = Depends(get_admin_user)):
    result = await db.stories.delete_one({"id": story_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": "Story deleted successfully"}

# ============= Donations Routes =============

@api_router.get("/donations", response_model=List[Donation])
async def get_donations(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        donations = await db.donations.find({}, {"_id": 0}).to_list(1000)
    else:
        donations = await db.donations.find({"donor_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for donation in donations:
        if isinstance(donation['created_at'], str):
            donation['created_at'] = datetime.fromisoformat(donation['created_at'])
    return donations

@api_router.post("/donations", response_model=Donation)
async def create_donation(donation_input: DonationCreate, current_user: User = Depends(get_current_user)):
    donation_dict = donation_input.model_dump()
    donation_dict['donor_id'] = current_user.id
    donation_dict['donor_name'] = current_user.full_name
    donation_obj = Donation(**donation_dict)
    
    doc = donation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.donations.insert_one(doc)
    return donation_obj

@api_router.get("/stats")
async def get_stats():
    families_count = await db.families.count_documents({})
    donations_count = await db.donations.count_documents({})
    health_cases_count = await db.health_cases.count_documents({})
    projects_count = await db.projects.count_documents({})
    
    # Calculate total donations
    donations = await db.donations.find({"type": "family"}, {"_id": 0}).to_list(10000)
    total_amount = sum(d.get('amount', 0) for d in donations if d.get('amount'))
    
    return {
        "families": families_count,
        "donations": donations_count,
        "health_cases": health_cases_count,
        "projects": projects_count,
        "total_donated": total_amount
    }

# ============= Mission Content Routes =============

@api_router.get("/mission-content")
async def get_mission_content():
    content = await db.mission_content.find_one({"id": "mission_content"}, {"_id": 0})
    if not content:
        # Return default content if not exists
        return {
            "id": "mission_content",
            "vision_text": "نحن نؤمن بأن شعبنا العظيم يستحق قيادة عظيمة تمكنه من النمو والتطور...",
            "vision_highlight": "شعبنا العظيم يحتاج إلى قيادة عظيمة تساعده على التطور والنمو...",
            "principles": [],
            "old_model": [],
            "new_model": [],
            "testimonials": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    if isinstance(content.get('updated_at'), str):
        content['updated_at'] = datetime.fromisoformat(content['updated_at'])
    return content

@api_router.put("/mission-content")
async def update_mission_content(content_input: MissionContentUpdate, admin: User = Depends(get_admin_user)):
    update_data = content_input.model_dump(exclude_none=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.mission_content.update_one(
        {"id": "mission_content"},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.mission_content.find_one({"id": "mission_content"}, {"_id": 0})
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

# ============= Hero Content Routes =============

@api_router.get("/hero-content")
async def get_hero_content():
    content = await db.hero_content.find_one({"id": "hero_content"}, {"_id": 0})
    if not content:
        # Return default content if not exists
        default_quotes = [
            {
                "text": "\" وَيُؤْثِرُونَ عَلَى أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ \"",
                "ref": "- الحشر 9",
                "author": "العطاء الحقيقي هو أن تُقدّم وأنت محتاج، لا وأنت مستغنٍ."
            },
            {
                "text": "قال ﷺ: «أفضل الناس أنفعهم للناس»",
                "ref": "",
                "author": "كن نافعًا، فالعطاء هو المعنى الحقيقي للإنسانية."
            },
            {
                "text": "قال ﷺ: «لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه»",
                "ref": "",
                "author": "الإيمان ليس صلاة وصيامًا فقط… بل حبٌّ للآخرين وعطاء."
            }
        ]
        return {
            "id": "hero_content",
            "title": "معاً نَبني مجتمعاً متكافلاً في مدينة حماة",
            "subtitle": "منصة إلكترونية تمكن لجان الأحياء من تنظيم العمل التطوعي والتكافلي بين أفراد المجتمع والمغتربين ورواد المجتمع لمساعدة المحتاجين",
            "cta_text": "ابدأ رحلتك التطوعية",
            "cta_link": "/families",
            "background_image": None,
            "quotes": default_quotes,
            "video_url": "https://www.youtube.com/embed/XmYV-ZVZj04",
            "video_title": "شاهد كيف يمكنك إحداث فرق حقيقي",
            "video_description": "فيديو توجيهي يشرح أهمية العمل التكافلي وكيفية المشاركة في مبادراتنا",
            "video_subtitle": "يشرح هذا الفيديو كيف يمكن لأي شخص، بغض النظر عن موقعه أو إمكانياته، أن يساهم في دعم المجتمع المحلي في مدينة حماة. سواء كنت مقيمًا في المحافظة أو مغتربًا في الخارج، هناك دائمًا طريقة للمساهمة.",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    if isinstance(content.get('updated_at'), str):
        content['updated_at'] = datetime.fromisoformat(content['updated_at'])
    return content

@api_router.put("/hero-content")
async def update_hero_content(content_input: HeroContentUpdate, admin: User = Depends(get_admin_user)):
    update_data = content_input.model_dump(exclude_none=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.hero_content.update_one(
        {"id": "hero_content"},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.hero_content.find_one({"id": "hero_content"}, {"_id": 0})
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

# Image upload
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    contents = await file.read()
    base64_encoded = base64.b64encode(contents).decode('utf-8')
    image_data = f"data:{file.content_type};base64,{base64_encoded}"
    return {"image_url": image_data}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()