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
    role: str = "user"  # user, admin, committee_member, committee_president
    neighborhood_id: Optional[str] = None
    phone: Optional[str] = None
    committee_member_id: Optional[str] = None  # ربط المستخدم بعضو اللجنة إذا كان عضو أو رئيس لجنة
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    neighborhood_id: Optional[str] = None
    phone: Optional[str] = None

# Family Models
class Family(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_number: Optional[str] = None  # رقم العائلة (تلقائي، غير قابل للتعديل)
    family_code: Optional[str] = None  # رمز العائلة
    fac_name: Optional[str] = None  # اسم الفاك (اسم مستعار)
    name: str
    phone: Optional[str] = None  # رقم الهاتف
    # معلومات المعيل
    provider_first_name: Optional[str] = None  # الاسم الأول للمعيل
    provider_father_name: Optional[str] = None  # اسم الأب للمعيل
    provider_surname: Optional[str] = None  # الكنية للمعيل
    members_count: int
    description: str
    monthly_need: float
    need_assessment: Optional[str] = None  # للتوافق مع البيانات القديمة (deprecated)
    need_assessment_id: Optional[str] = None  # معرف تقييم الاحتياج (الجديد)
    current_sponsors: int = 0
    image: Optional[str] = None  # صورة واحدة (deprecated)
    images: Optional[List[str]] = []  # قائمة صور العائلة
    status: str = "active"  # active, sponsored
    neighborhood_id: Optional[str] = None
    # الحقول الجديدة
    category_id: Optional[str] = None  # تصنيف العائلة
    income_level_id: Optional[str] = None  # مستوى الدخل الشهري
    father_present: Optional[bool] = None  # الأب موجود
    mother_present: Optional[bool] = None  # الأم موجودة
    female_children_count: Optional[int] = 0  # عدد الأطفال الإناث
    male_children_count: Optional[int] = 0  # عدد الأطفال الذكور
    is_active: bool = True  # للحذف الناعم
    created_by_user_id: Optional[str] = None  # معرف المستخدم الذي أضاف العائلة
    updated_by_user_id: Optional[str] = None  # معرف المستخدم الذي قام بآخر تعديل
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class FamilyCreate(BaseModel):
    family_code: Optional[str] = None  # رمز العائلة
    fac_name: Optional[str] = None  # اسم الفاك (اسم مستعار)
    name: str
    phone: Optional[str] = None  # رقم الهاتف
    # معلومات المعيل
    provider_first_name: Optional[str] = None  # الاسم الأول للمعيل
    provider_father_name: Optional[str] = None  # اسم الأب للمعيل
    provider_surname: Optional[str] = None  # الكنية للمعيل
    members_count: int
    description: str
    monthly_need: float
    need_assessment: Optional[str] = None  # للتوافق مع البيانات القديمة (deprecated)
    need_assessment_id: Optional[str] = None  # معرف تقييم الاحتياج (الجديد)
    image: Optional[str] = None
    neighborhood_id: Optional[str] = None
    category_id: Optional[str] = None
    income_level_id: Optional[str] = None
    father_present: Optional[bool] = None
    mother_present: Optional[bool] = None
    female_children_count: Optional[int] = 0
    male_children_count: Optional[int] = 0

# Donation Models - نموذج محسّن للتبرعات
class Donation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: str  # معرف العائلة المستفيدة
    donor_id: Optional[str] = None  # معرف المتبرع (إذا كان مسجلاً)
    donor_name: str  # اسم المتبرع
    donor_phone: Optional[str] = None  # رقم هاتف المتبرع
    donor_email: Optional[str] = None  # بريد المتبرع
    donation_type: str  # مالية، عينية، خدمية، أخرى
    amount: str  # القيمة أو الكمية (نص حر مثل: "500 ريال" أو "سلة غذائية")
    description: str  # وصف المساعدة
    notes: Optional[str] = None  # ملاحظات إضافية
    status: str = "pending"  # pending, approved, completed, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_user_id: Optional[str] = None  # من قام بتسجيل التبرع
    is_active: bool = True

class DonationCreate(BaseModel):
    family_id: str
    donor_name: str
    donor_phone: Optional[str] = None
    donor_email: Optional[str] = None
    donation_type: str
    amount: str
    description: str
    notes: Optional[str] = None
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
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_background_image: Optional[str] = None
    vision_text: str
    vision_highlight: str
    vision_image: Optional[str] = None  # Base64 image or URL
    principles: List[dict]  # [{icon, title, description}]
    old_model: List[str]
    new_model: List[str]
    testimonials: List[dict]  # [{name, role, text}]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MissionContentUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_background_image: Optional[str] = None
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

# Neighborhood Models
class Neighborhood(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    number: str
    polygon_coordinates: Optional[List[List[float]]] = None  # [[lat, lng], [lat, lng], ...]
    is_active: bool = True
    image: Optional[str] = None
    logo: Optional[str] = None
    families_count: int = 0
    population_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class NeighborhoodCreate(BaseModel):
    name: str
    number: str
    polygon_coordinates: Optional[List[List[float]]] = None
    is_active: bool = True
    image: Optional[str] = None
    logo: Optional[str] = None
    families_count: int = 0
    population_count: int = 0

class NeighborhoodUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[str] = None
    polygon_coordinates: Optional[List[List[float]]] = None
    is_active: Optional[bool] = None
    image: Optional[str] = None
    logo: Optional[str] = None
    families_count: Optional[int] = None
    population_count: Optional[int] = None

# Position/Role Models (للاختصاصات)
class Position(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PositionCreate(BaseModel):
    title: str

class PositionUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

# Job/Occupation Models (قائمة الأعمال)
class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobCreate(BaseModel):
    title: str

class JobUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

# Education Level Models (قائمة المؤهلات الدراسية)
class EducationLevel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EducationLevelCreate(BaseModel):
    title: str

class EducationLevelUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

# User Role Models (أنواع المستخدمين)
class UserRole(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # اسم الدور (admin, user, committee_member, etc.)
    display_name: str  # الاسم المعروض بالعربية
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRoleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None

class UserRoleUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# Family Category Models (تصنيف العائلات)
class FamilyCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # اسم التصنيف
    description: Optional[str] = None
    color: Optional[str] = None  # لون مميز للتصنيف
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FamilyCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None

class FamilyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

# Income Level Models (مستويات الدخل الشهري)
class IncomeLevel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # اسم المستوى (منخفض، متوسط، مرتفع)
    description: Optional[str] = None
    min_amount: Optional[int] = None  # الحد الأدنى
    max_amount: Optional[int] = None  # الحد الأقصى
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IncomeLevelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    min_amount: Optional[int] = None
    max_amount: Optional[int] = None

class IncomeLevelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_amount: Optional[int] = None
    max_amount: Optional[int] = None
    is_active: Optional[bool] = None

# Need Assessment Models (تقييم الاحتياج)
class NeedAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # اسم التقييم (منخفض، متوسط، مرتفع، حرج/عاجل)
    description: Optional[str] = None
    color: Optional[str] = None  # لون مميز لكل مستوى
    priority: Optional[int] = 0  # الأولوية (0-10)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NeedAssessmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = 0

class NeedAssessmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

# Need Models (الاحتياجات)
class Need(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # اسم الاحتياج
    description: Optional[str] = None  # التوصيف
    default_amount: Optional[float] = None  # المبلغ الافتراضي المطلوب
    is_active: bool = True
    created_by_user_id: Optional[str] = None  # المستخدم الذي أضاف
    updated_by_user_id: Optional[str] = None  # المستخدم الذي عدل
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class NeedCreate(BaseModel):
    name: str
    description: Optional[str] = None
    default_amount: Optional[float] = None

class NeedUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_amount: Optional[float] = None
    is_active: Optional[bool] = None


# FamilyNeed Models (جدول وسيط بين العائلات والاحتياجات)
class FamilyNeed(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: str  # معرف العائلة
    need_id: str  # معرف الاحتياج
    estimated_amount: float = 0.0  # المبلغ التقديري
    notes: Optional[str] = None  # ملاحظات
    status: str = "pending"  # pending, fulfilled, cancelled
    created_by_user_id: Optional[str] = None  # المستخدم الذي أضاف
    updated_by_user_id: Optional[str] = None  # المستخدم الذي عدل
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class FamilyNeedCreate(BaseModel):
    need_id: str
    estimated_amount: float = 0.0
    notes: Optional[str] = None
    status: str = "pending"

class FamilyNeedUpdate(BaseModel):
    need_id: Optional[str] = None
    amount: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    estimated_amount: Optional[float] = None
    status: Optional[str] = None

# Committee Member Models
class CommitteeMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    father_name: str
    last_name: str
    neighborhood_id: str
    position_id: str
    phone: str
    date_of_birth: Optional[str] = None  # المواليد
    occupation: Optional[str] = None  # العمل
    education: Optional[str] = None  # المؤهل الدراسي
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CommitteeMemberCreate(BaseModel):
    first_name: str
    father_name: str
    last_name: str
    neighborhood_id: str
    position_id: str
    phone: str
    date_of_birth: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[str] = None

class CommitteeMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    father_name: Optional[str] = None
    last_name: Optional[str] = None
    neighborhood_id: Optional[str] = None
    position_id: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

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
    
    # التحقق من أن الحساب نشط
    if user.get('is_active') == False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="حسابك متوقف. يرجى التواصل مع الإدارة"
        )
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user_obj.id})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= Users Management Routes (Admin Only) =============
@api_router.get("/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if role not in ["user", "admin", "committee_member", "committee_president"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

@api_router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # منع تعطيل الحساب الشخصي
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    update_data = {
        "is_active": is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

# ============= User Profile Routes =============
@api_router.put("/users/me", response_model=User)
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    update_data = {}
    
    if profile_data.full_name:
        update_data['full_name'] = profile_data.full_name
    
    if profile_data.email and profile_data.email != current_user.email:
        # التحقق من أن البريد الإلكتروني غير مستخدم
        existing = await db.users.find_one({"email": profile_data.email, "id": {"$ne": current_user.id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        update_data['email'] = profile_data.email
    
    if profile_data.neighborhood_id:
        update_data['neighborhood_id'] = profile_data.neighborhood_id
    
    if profile_data.phone is not None:  # السماح بحذف رقم الجوال
        update_data['phone'] = profile_data.phone
    
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc)
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    # جلب المستخدم المحدث
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    if isinstance(updated_user.get('updated_at'), str):
        updated_user['updated_at'] = datetime.fromisoformat(updated_user['updated_at'])
    
    return User(**{k: v for k, v in updated_user.items() if k != 'password'})

@api_router.put("/users/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    # جلب المستخدم مع كلمة المرور
    user_doc = await db.users.find_one({"id": current_user.id})
    
    if not user_doc or not verify_password(password_data.current_password, user_doc['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # تشفير كلمة المرور الجديدة
    hashed_password = get_password_hash(password_data.new_password)
    
    # تحديث كلمة المرور
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "password": hashed_password,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Password changed successfully"}

# ============= Family Routes =============

@api_router.get("/families", response_model=List[Family])
async def get_families():
    families = await db.families.find({}, {"_id": 0}).to_list(1000)
    for family in families:
        if isinstance(family.get('created_at'), str):
            family['created_at'] = datetime.fromisoformat(family['created_at'])
        if isinstance(family.get('updated_at'), str):
            family['updated_at'] = datetime.fromisoformat(family['updated_at'])
    return families

# ============= Public Routes (لا تحتاج authentication) =============

@api_router.get("/public/families-stats")
async def get_public_families_stats():
    """إحصائيات عامة للعائلات حسب التصنيفات - بدون authentication"""
    try:
        # جلب جميع العائلات النشطة
        families = await db.families.find({"is_active": {"$ne": False}}, {"_id": 0, "id": 1, "category_id": 1}).to_list(10000)
        
        # جلب جميع التصنيفات النشطة
        categories = await db.family_categories.find({"is_active": {"$ne": False}}, {"_id": 0}).to_list(1000)
        
        # حساب عدد العائلات لكل تصنيف
        category_counts = {}
        for family in families:
            cat_id = family.get('category_id')
            if cat_id:
                category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
        
        # إضافة العدد لكل تصنيف
        result = []
        for category in categories:
            result.append({
                **category,
                "families_count": category_counts.get(category['id'], 0)
            })
        
        return {
            "categories": result,
            "total_families": len(families)
        }
    except Exception as e:
        print(f"Error in get_public_families_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/public/families-by-category/{category_id}")
async def get_families_by_category(
    category_id: str,
    neighborhood_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """جلب عائلات تصنيف معين - يتطلب تسجيل دخول"""
    try:
        # بناء الـ query
        query = {
            "category_id": category_id,
            "is_active": {"$ne": False}
        }
        
        # إذا لم يكن مدير، نعرض فقط عائلات حيه
        if current_user.role != "admin" and current_user.neighborhood_id:
            query["neighborhood_id"] = current_user.neighborhood_id
        
        # إذا كان مدير واختار حي معين
        if neighborhood_id and current_user.role == "admin":
            query["neighborhood_id"] = neighborhood_id
        
        # جلب العائلات
        families = await db.families.find(query, {"_id": 0}).to_list(1000)
        
        # تحويل التواريخ
        for family in families:
            if isinstance(family.get('created_at'), str):
                family['created_at'] = datetime.fromisoformat(family['created_at'])
            if isinstance(family.get('updated_at'), str):
                family['updated_at'] = datetime.fromisoformat(family['updated_at'])
        
        return families
    except Exception as e:
        print(f"Error in get_families_by_category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/public/neighborhoods")
async def get_neighborhoods():
    """جلب جميع الأحياء النشطة - بدون authentication"""
    try:
        neighborhoods = await db.neighborhoods.find({"is_active": {"$ne": False}}, {"_id": 0}).to_list(1000)
        return neighborhoods
    except Exception as e:
        print(f"Error in get_neighborhoods: {e}")
        raise HTTPException(status_code=500, detail=str(e))



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
    
    # توليد رقم العائلة تلقائياً
    # نحصل على آخر رقم عائلة ونزيد واحد
    last_family = await db.families.find_one(
        {"family_number": {"$exists": True, "$ne": None}},
        {"_id": 0, "family_number": 1},
        sort=[("family_number", -1)]
    )
    
    if last_family and last_family.get('family_number'):
        # استخراج الرقم من الصيغة FAM-001
        try:
            last_num = int(last_family['family_number'].split('-')[1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    family_dict['family_number'] = f"FAM-{new_num:03d}"
    
    # حفظ معرف المستخدم الذي أضاف العائلة
    family_dict['created_by_user_id'] = admin.id
    
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
    update_data['updated_at'] = datetime.now(timezone.utc)
    
    # الحفاظ على رقم العائلة (غير قابل للتعديل)
    if 'family_number' in existing:
        update_data['family_number'] = existing['family_number']
    
    # الحفاظ على المستخدم الذي أنشأ العائلة
    if 'created_by_user_id' in existing:
        update_data['created_by_user_id'] = existing['created_by_user_id']
    
    # حفظ معرف المستخدم الذي قام بالتعديل
    update_data['updated_by_user_id'] = admin.id
    
    await db.families.update_one({"id": family_id}, {"$set": update_data})
    
    updated = await db.families.find_one({"id": family_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return Family(**updated)

@api_router.post("/families/{family_id}/images")
async def add_family_image(family_id: str, file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    """إضافة صورة للعائلة"""
    family = await db.families.find_one({"id": family_id})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # قراءة الصورة وتحويلها إلى Base64
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:{file.content_type};base64,{base64_image}"
    
    # إضافة الصورة إلى قائمة الصور
    current_images = family.get('images', [])
    current_images.append(image_url)
    
    await db.families.update_one(
        {"id": family_id},
        {
            "$set": {
                "images": current_images,
                "updated_at": datetime.now(timezone.utc),
                "updated_by_user_id": admin.id
            }
        }
    )
    
    return {"message": "Image added successfully", "image_url": image_url}

@api_router.delete("/families/{family_id}/images/{image_index}")
async def delete_family_image(family_id: str, image_index: int, admin: User = Depends(get_admin_user)):
    """حذف صورة من العائلة"""
    family = await db.families.find_one({"id": family_id})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    current_images = family.get('images', [])
    if image_index < 0 or image_index >= len(current_images):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # حذف الصورة من القائمة
    current_images.pop(image_index)
    
    await db.families.update_one(
        {"id": family_id},
        {
            "$set": {
                "images": current_images,
                "updated_at": datetime.now(timezone.utc),
                "updated_by_user_id": admin.id
            }
        }
    )
    
    return {"message": "Image deleted successfully"}

@api_router.put("/families/{family_id}/toggle-status")
async def toggle_family_status(
    family_id: str,
    request: dict,
    admin: User = Depends(get_admin_user)
):
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    update_data = {
        "is_active": is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.families.update_one({"id": family_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Family not found")
    
    return {"message": f"Family {'activated' if is_active else 'deactivated'} successfully"}

# ============= Family Categories Routes =============
@api_router.get("/family-categories", response_model=List[FamilyCategory])
async def get_family_categories(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    categories = await db.family_categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/family-categories", response_model=FamilyCategory)
async def create_family_category(category_data: FamilyCategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = FamilyCategory(**category_data.model_dump())
    await db.family_categories.insert_one(category.model_dump())
    return category

@api_router.put("/family-categories/{category_id}", response_model=FamilyCategory)
async def update_family_category(
    category_id: str,
    category_data: FamilyCategoryUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {k: v for k, v in category_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.family_categories.update_one({"id": category_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Family category not found")
    
    updated_category = await db.family_categories.find_one({"id": category_id}, {"_id": 0})
    return FamilyCategory(**updated_category)

@api_router.put("/family-categories/{category_id}/toggle-status")
async def toggle_family_category_status(
    category_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    result = await db.family_categories.update_one(
        {"id": category_id}, 
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Family category not found")
    
    return {"message": f"Family category {'activated' if is_active else 'deactivated'} successfully"}

# ============= Income Levels Routes =============
@api_router.get("/income-levels", response_model=List[IncomeLevel])
async def get_income_levels(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    levels = await db.income_levels.find({}, {"_id": 0}).to_list(1000)
    return levels

@api_router.post("/income-levels", response_model=IncomeLevel)
async def create_income_level(level_data: IncomeLevelCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    level = IncomeLevel(**level_data.model_dump())
    await db.income_levels.insert_one(level.model_dump())
    return level

@api_router.put("/income-levels/{level_id}", response_model=IncomeLevel)
async def update_income_level(
    level_id: str,
    level_data: IncomeLevelUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {k: v for k, v in level_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.income_levels.update_one({"id": level_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Income level not found")
    
    updated_level = await db.income_levels.find_one({"id": level_id}, {"_id": 0})
    return IncomeLevel(**updated_level)

@api_router.put("/income-levels/{level_id}/toggle-status")
async def toggle_income_level_status(
    level_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    result = await db.income_levels.update_one(
        {"id": level_id}, 
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Income level not found")
    
    return {"message": f"Income level {'activated' if is_active else 'deactivated'} successfully"}

# ============= Need Assessment Routes =============

@api_router.get("/need-assessments", response_model=List[NeedAssessment])
async def get_need_assessments(current_user: User = Depends(get_current_user)):
    assessments = await db.need_assessments.find({}, {"_id": 0}).to_list(1000)
    return [NeedAssessment(**assessment) for assessment in assessments]

@api_router.post("/need-assessments", response_model=NeedAssessment)
async def create_need_assessment(
    assessment_input: NeedAssessmentCreate,
    admin: User = Depends(get_admin_user)
):
    assessment_dict = assessment_input.model_dump()
    assessment_obj = NeedAssessment(**assessment_dict)
    
    doc = assessment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.need_assessments.insert_one(doc)
    return assessment_obj

@api_router.put("/need-assessments/{assessment_id}", response_model=NeedAssessment)
async def update_need_assessment(
    assessment_id: str,
    assessment_data: NeedAssessmentUpdate,
    admin: User = Depends(get_admin_user)
):
    existing = await db.need_assessments.find_one({"id": assessment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Need assessment not found")
    
    update_dict = {k: v for k, v in assessment_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.need_assessments.update_one({"id": assessment_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Need assessment not found")
    
    updated_assessment = await db.need_assessments.find_one({"id": assessment_id}, {"_id": 0})
    return NeedAssessment(**updated_assessment)

@api_router.put("/need-assessments/{assessment_id}/toggle-status")
async def toggle_need_assessment_status(
    assessment_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    result = await db.need_assessments.update_one(
        {"id": assessment_id}, 
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Need assessment not found")
    
    return {"message": f"Need assessment {'activated' if is_active else 'deactivated'} successfully"}

# ============= Needs Routes (الاحتياجات) =============

@api_router.get("/needs", response_model=List[Need])
async def get_needs(current_user: User = Depends(get_current_user)):
    needs = await db.needs.find({}, {"_id": 0}).to_list(1000)
    return [Need(**need) for need in needs]

@api_router.post("/needs", response_model=Need)
async def create_need(
    need_input: NeedCreate,
    admin: User = Depends(get_admin_user)
):
    need_dict = need_input.model_dump()
    
    # حفظ معرف المستخدم الذي أضاف الاحتياج
    need_dict['created_by_user_id'] = admin.id
    
    need_obj = Need(**need_dict)
    
    doc = need_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.needs.insert_one(doc)
    return need_obj

@api_router.put("/needs/{need_id}", response_model=Need)
async def update_need(
    need_id: str,
    need_data: NeedUpdate,
    admin: User = Depends(get_admin_user)
):
    existing = await db.needs.find_one({"id": need_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Need not found")
    
    update_dict = {k: v for k, v in need_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # إضافة تاريخ التحديث ومعرف المستخدم الذي عدل
    update_dict['updated_at'] = datetime.now(timezone.utc)
    update_dict['updated_by_user_id'] = admin.id
    
    # الحفاظ على المستخدم الذي أنشأ الاحتياج
    if 'created_by_user_id' in existing:
        update_dict['created_by_user_id'] = existing['created_by_user_id']
    
    result = await db.needs.update_one({"id": need_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Need not found")
    
    updated_need = await db.needs.find_one({"id": need_id}, {"_id": 0})
    
    # تحويل التواريخ
    if isinstance(updated_need.get('created_at'), str):
        updated_need['created_at'] = datetime.fromisoformat(updated_need['created_at'])
    if isinstance(updated_need.get('updated_at'), str):
        updated_need['updated_at'] = datetime.fromisoformat(updated_need['updated_at'])
    
    return Need(**updated_need)

@api_router.put("/needs/{need_id}/toggle-status")
async def toggle_need_status(
    need_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    result = await db.needs.update_one(
        {"id": need_id}, 
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Need not found")
    
    return {"message": f"Need {'activated' if is_active else 'deactivated'} successfully"}


# ============= Family Needs Routes (احتياجات العائلات) =============

@api_router.get("/families/{family_id}/needs")
async def get_family_needs(family_id: str, current_user: User = Depends(get_current_user)):
    """الحصول على جميع احتياجات عائلة معينة - محسّن للأداء"""
    # التحقق من وجود العائلة
    family = await db.families.find_one({"id": family_id}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # الحصول على احتياجات العائلة
    family_needs = await db.family_needs.find({"family_id": family_id}, {"_id": 0}).to_list(1000)
    
    if not family_needs:
        return []
    
    # جمع جميع الـ IDs مرة واحدة
    need_ids = [fn["need_id"] for fn in family_needs]
    user_ids = set()
    for fn in family_needs:
        if fn.get("created_by_user_id"):
            user_ids.add(fn["created_by_user_id"])
        if fn.get("updated_by_user_id"):
            user_ids.add(fn["updated_by_user_id"])
    
    # جلب جميع الاحتياجات في query واحد
    needs = await db.needs.find({"id": {"$in": need_ids}}, {"_id": 0}).to_list(1000)
    needs_dict = {need["id"]: need for need in needs}
    
    # جلب جميع المستخدمين في query واحد
    users = await db.users.find(
        {"id": {"$in": list(user_ids)}}, 
        {"_id": 0, "id": 1, "full_name": 1}
    ).to_list(1000)
    users_dict = {user["id"]: user for user in users}
    
    # بناء النتيجة
    result = []
    for fn in family_needs:
        result.append({
            **fn,
            "need": needs_dict.get(fn["need_id"]),
            "created_by_user": users_dict.get(fn.get("created_by_user_id")),
            "updated_by_user": users_dict.get(fn.get("updated_by_user_id"))
        })
    
    return result

@api_router.post("/families/{family_id}/needs")
async def add_family_need(
    family_id: str, 
    need_input: FamilyNeedCreate, 
    current_user: User = Depends(get_current_user)
):
    """إضافة احتياج جديد للعائلة"""
    # التحقق من وجود العائلة
    family = await db.families.find_one({"id": family_id}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # التحقق من وجود الاحتياج
    need = await db.needs.find_one({"id": need_input.need_id}, {"_id": 0})
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    
    # التحقق من عدم تكرار الاحتياج
    existing = await db.family_needs.find_one({
        "family_id": family_id,
        "need_id": need_input.need_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="هذا الاحتياج موجود بالفعل لهذه العائلة")
    
    # إنشاء السجل
    family_need_dict = need_input.model_dump()
    family_need_dict["family_id"] = family_id
    family_need_dict["created_by_user_id"] = current_user.id
    
    family_need = FamilyNeed(**family_need_dict)
    doc = family_need.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.family_needs.insert_one(doc)
    
    return family_need

@api_router.put("/families/{family_id}/needs/{need_record_id}")
async def update_family_need(
    family_id: str,
    need_record_id: str,
    need_update: FamilyNeedUpdate,
    current_user: User = Depends(get_current_user)
):
    """تحديث احتياج عائلة"""
    # التحقق من وجود السجل
    existing = await db.family_needs.find_one({
        "id": need_record_id,
        "family_id": family_id
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Family need record not found")
    
    # تحديث السجل
    update_data = {k: v for k, v in need_update.model_dump().items() if v is not None}
    update_data["updated_by_user_id"] = current_user.id
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.family_needs.update_one(
        {"id": need_record_id},
        {"$set": update_data}
    )
    
    # إرجاع السجل المحدث
    updated_record = await db.family_needs.find_one({"id": need_record_id}, {"_id": 0})
    
    # تحويل التواريخ
    if isinstance(updated_record.get('created_at'), str):
        updated_record['created_at'] = datetime.fromisoformat(updated_record['created_at'])
    if isinstance(updated_record.get('updated_at'), str):
        updated_record['updated_at'] = datetime.fromisoformat(updated_record['updated_at'])
    
    return FamilyNeed(**updated_record)

@api_router.delete("/families/{family_id}/needs/{need_record_id}")
async def delete_family_need(
    family_id: str,
    need_record_id: str,
    current_user: User = Depends(get_current_user)
):
    """حذف احتياج من عائلة"""
    # التحقق من وجود السجل
    existing = await db.family_needs.find_one({
        "id": need_record_id,
        "family_id": family_id
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Family need record not found")
    
    # حذف السجل
    await db.family_needs.delete_one({"id": need_record_id})
    
    return {"message": "Family need deleted successfully"}

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

@api_router.get("/donations")
async def get_donations(current_user: User = Depends(get_current_user)):
    """جلب جميع التبرعات - بدون response_model للتوافق مع البيانات القديمة"""
    if current_user.role == "admin":
        donations = await db.donations.find({}, {"_id": 0}).to_list(1000)
    else:
        donations = await db.donations.find({"donor_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # تحويل البيانات للصيغة الموحدة
    result = []
    for donation in donations:
        # تحويل التواريخ
        if isinstance(donation.get('created_at'), str):
            donation['created_at'] = datetime.fromisoformat(donation['created_at'])
        
        # توحيد الحقول بين القديم والجديد
        normalized = {
            'id': donation.get('id'),
            'family_id': donation.get('family_id') or donation.get('target_id', ''),
            'donor_id': donation.get('donor_id'),
            'donor_name': donation.get('donor_name', 'متبرع'),
            'donor_phone': donation.get('donor_phone'),
            'donor_email': donation.get('donor_email'),
            'donation_type': donation.get('donation_type') or donation.get('type', 'مالية'),
            'amount': str(donation.get('amount', '')) if donation.get('amount') else donation.get('items', 'غير محدد'),
            'description': donation.get('description') or donation.get('message', 'تبرع'),
            'notes': donation.get('notes'),
            'status': donation.get('status', 'pending'),
            'created_at': donation.get('created_at'),
            'created_by_user_id': donation.get('created_by_user_id'),
            'is_active': donation.get('is_active', True),
            # إضافة الحقول القديمة للتوافق
            'type': donation.get('type', 'family'),
            'target_id': donation.get('target_id') or donation.get('family_id'),
            'items': donation.get('items'),
            'message': donation.get('message')
        }
        result.append(normalized)
    
    return result

@api_router.post("/donations", response_model=Donation)
async def create_donation(donation_input: DonationCreate, current_user: User = Depends(get_current_user)):
    """إنشاء تبرع جديد"""
    donation_dict = donation_input.model_dump()
    
    # إذا كان المستخدم مسجلاً، نضيف معلوماته
    if current_user:
        donation_dict['donor_id'] = current_user.id
        donation_dict['created_by_user_id'] = current_user.id
    
    donation_obj = Donation(**donation_dict)
    
    doc = donation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.donations.insert_one(doc)
    return donation_obj

@api_router.get("/families/{family_id}/donations")
async def get_family_donations(family_id: str):
    """جلب جميع التبرعات لعائلة معينة"""
    try:
        # البحث بكلا الحقلين: family_id (الجديد) و target_id (القديم)
        donations = await db.donations.find(
            {
                "$or": [
                    {"family_id": family_id},
                    {"target_id": family_id, "type": "family"}
                ],
                "is_active": {"$ne": False}
            },
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        # تحويل البيانات القديمة للصيغة الجديدة
        result = []
        for donation in donations:
            # تحويل التواريخ
            if isinstance(donation.get('created_at'), str):
                donation['created_at'] = datetime.fromisoformat(donation['created_at'])
            
            # توحيد الحقول
            normalized = {
                'id': donation.get('id'),
                'family_id': donation.get('family_id') or donation.get('target_id'),
                'donor_id': donation.get('donor_id'),
                'donor_name': donation.get('donor_name', 'متبرع'),
                'donor_phone': donation.get('donor_phone'),
                'donor_email': donation.get('donor_email'),
                'donation_type': donation.get('donation_type') or donation.get('type', 'مالية'),
                'amount': str(donation.get('amount', '')) if donation.get('amount') else donation.get('items', 'غير محدد'),
                'description': donation.get('description') or donation.get('message', 'تبرع'),
                'notes': donation.get('notes'),
                'status': donation.get('status', 'pending'),
                'created_at': donation.get('created_at'),
                'created_by_user_id': donation.get('created_by_user_id'),
                'is_active': donation.get('is_active', True)
            }
            result.append(normalized)
        
        return result
    except Exception as e:
        print(f"Error fetching family donations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/donations/{donation_id}")
async def update_donation_status(
    donation_id: str, 
    status: str = None,
    current_user: User = Depends(get_current_user)
):
    """تحديث حالة التبرع - متاح للمشرفين فقط"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    try:
        # التحقق من وجود التبرع
        donation = await db.donations.find_one({"id": donation_id}, {"_id": 0})
        if not donation:
            raise HTTPException(status_code=404, detail="التبرع غير موجود")
        
        # تحديث الحالة
        update_data = {}
        if status:
            update_data["status"] = status
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.donations.update_one(
            {"id": donation_id},
            {"$set": update_data}
        )
        
        # جلب التبرع المحدث
        updated_donation = await db.donations.find_one({"id": donation_id}, {"_id": 0})
        return updated_donation
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating donation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            "hero_title": "رؤيتنا ورسالتنا",
            "hero_subtitle": "من حماة... نُعيد للإنسان قيمته، وللمجتمع وحدته.. نحو تنمية مستدامة وكرامة إنسانية",
            "hero_background_image": None,
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
    
    await db.mission_content.update_one(
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

# ============= Neighborhoods Routes =============
@api_router.get("/neighborhoods")
async def get_neighborhoods(page: int = 1, limit: int = 20):
    """
    Get neighborhoods with pagination
    - page: Page number (default: 1)
    - limit: Items per page (default: 20)
    """
    skip = (page - 1) * limit
    
    # Get total count
    total = await db.neighborhoods.count_documents({})
    
    # Get paginated neighborhoods
    neighborhoods = await db.neighborhoods.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "items": neighborhoods,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit  # Calculate total pages
    }

@api_router.get("/neighborhoods/{neighborhood_id}", response_model=Neighborhood)
async def get_neighborhood(neighborhood_id: str):
    neighborhood = await db.neighborhoods.find_one({"id": neighborhood_id}, {"_id": 0})
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    return neighborhood

@api_router.post("/neighborhoods", response_model=Neighborhood)
async def create_neighborhood(neighborhood: NeighborhoodCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    neighborhood_obj = Neighborhood(**neighborhood.model_dump())
    doc = neighborhood_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.neighborhoods.insert_one(doc)
    return neighborhood_obj

@api_router.put("/neighborhoods/{neighborhood_id}", response_model=Neighborhood)
async def update_neighborhood(
    neighborhood_id: str, 
    neighborhood_update: NeighborhoodUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in neighborhood_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Add updated_at timestamp
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.neighborhoods.update_one({"id": neighborhood_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    
    updated = await db.neighborhoods.find_one({"id": neighborhood_id}, {"_id": 0})
    return updated

@api_router.delete("/neighborhoods/{neighborhood_id}")
async def delete_neighborhood(neighborhood_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.neighborhoods.delete_one({"id": neighborhood_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    return {"message": "Neighborhood deleted successfully"}

# ============= Positions Routes =============
@api_router.get("/positions", response_model=List[Position])
async def get_positions():
    positions = await db.positions.find({}, {"_id": 0}).to_list(1000)
    return positions

@api_router.post("/positions", response_model=Position)
async def create_position(position: PositionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    position_obj = Position(**position.model_dump())
    doc = position_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.positions.insert_one(doc)
    return position_obj

@api_router.put("/positions/{position_id}", response_model=Position)
async def update_position(
    position_id: str,
    position_update: PositionUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in position_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.positions.update_one({"id": position_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    
    updated = await db.positions.find_one({"id": position_id}, {"_id": 0})
    return updated

@api_router.delete("/positions/{position_id}")
async def delete_position(position_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.positions.delete_one({"id": position_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"message": "Position deleted successfully"}

# ============= Jobs/Occupations Routes =============
@api_router.get("/jobs", response_model=List[Job])
async def get_jobs():
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(1000)
    return jobs

@api_router.post("/jobs", response_model=Job)
async def create_job(job: JobCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    job_obj = Job(**job.model_dump())
    doc = job_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.jobs.insert_one(doc)
    return job_obj

@api_router.put("/jobs/{job_id}", response_model=Job)
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in job_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    updated = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return updated

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}

# ============= Education Levels Routes =============
@api_router.get("/education-levels", response_model=List[EducationLevel])
async def get_education_levels():
    levels = await db.education_levels.find({}, {"_id": 0}).to_list(1000)
    return levels

@api_router.post("/education-levels", response_model=EducationLevel)
async def create_education_level(level: EducationLevelCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    level_obj = EducationLevel(**level.model_dump())
    doc = level_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.education_levels.insert_one(doc)
    return level_obj

@api_router.put("/education-levels/{level_id}", response_model=EducationLevel)
async def update_education_level(
    level_id: str,
    level_update: EducationLevelUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in level_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.education_levels.update_one({"id": level_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Education level not found")
    
    updated = await db.education_levels.find_one({"id": level_id}, {"_id": 0})
    return updated

@api_router.delete("/education-levels/{level_id}")
async def delete_education_level(level_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.education_levels.delete_one({"id": level_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Education level not found")
    return {"message": "Education level deleted successfully"}

# ============= User Roles Routes =============
@api_router.get("/user-roles", response_model=List[UserRole])
async def get_user_roles(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    roles = await db.user_roles.find({}, {"_id": 0}).to_list(1000)
    return roles

@api_router.post("/user-roles", response_model=UserRole)
async def create_user_role(role_data: UserRoleCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    role = UserRole(**role_data.model_dump())
    await db.user_roles.insert_one(role.model_dump())
    return role

@api_router.put("/user-roles/{role_id}", response_model=UserRole)
async def update_user_role(
    role_id: str,
    role_data: UserRoleUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {k: v for k, v in role_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.user_roles.update_one({"id": role_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User role not found")
    
    updated_role = await db.user_roles.find_one({"id": role_id}, {"_id": 0})
    return UserRole(**updated_role)

@api_router.put("/user-roles/{role_id}/toggle-status")
async def toggle_user_role_status(
    role_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    is_active = request.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    result = await db.user_roles.update_one(
        {"id": role_id}, 
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User role not found")
    
    return {"message": f"User role {'activated' if is_active else 'deactivated'} successfully"}

# ============= Committee Members Routes =============
@api_router.get("/committee-members", response_model=List[CommitteeMember])
async def get_committee_members(neighborhood_id: Optional[str] = None):
    query = {"neighborhood_id": neighborhood_id} if neighborhood_id else {}
    members = await db.committee_members.find(query, {"_id": 0}).to_list(1000)
    return members

@api_router.get("/committee-members/{member_id}", response_model=CommitteeMember)
async def get_committee_member(member_id: str):
    member = await db.committee_members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Committee member not found")
    return member

@api_router.post("/committee-members", response_model=CommitteeMember)
async def create_committee_member(member: CommitteeMemberCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    member_obj = CommitteeMember(**member.model_dump())
    doc = member_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.committee_members.insert_one(doc)
    return member_obj

@api_router.put("/committee-members/{member_id}", response_model=CommitteeMember)
async def update_committee_member(
    member_id: str,
    member_update: CommitteeMemberUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in member_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # Add updated_at timestamp
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.committee_members.update_one({"id": member_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Committee member not found")
    
    updated = await db.committee_members.find_one({"id": member_id}, {"_id": 0})
    return updated

@api_router.delete("/committee-members/{member_id}")
async def delete_committee_member(member_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.committee_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Committee member not found")
    return {"message": "Committee member deleted successfully"}

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

@app.on_event("startup")
async def startup_db():
    # Create default positions if they don't exist
    default_positions = [
        "رئيس اللجنة",
        "نائب الرئيس",
        "أمين الصندوق",
        "مسؤول التواصل",
        "مسؤول المشاريع",
        "مسؤول التوعية",
        "عضو لجنة"
    ]
    
    existing_count = await db.positions.count_documents({})
    if existing_count == 0:
        for title in default_positions:
            position = Position(title=title)
            doc = position.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.positions.insert_one(doc)
        logger.info(f"Created {len(default_positions)} default positions")
    
    # Create default jobs/occupations if they don't exist
    default_jobs = [
        'مهندس', 'طبيب', 'معلم', 'محامي', 'محاسب', 'صيدلي', 'فني',
        'موظف حكومي', 'موظف قطاع خاص', 'تاجر', 'صاحب عمل حر',
        'عامل', 'متقاعد', 'طالب', 'ربة منزل', 'أخرى'
    ]
    
    existing_jobs_count = await db.jobs.count_documents({})
    if existing_jobs_count == 0:
        for title in default_jobs:
            job = Job(title=title)
            doc = job.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.jobs.insert_one(doc)
        logger.info(f"Created {len(default_jobs)} default jobs")
    
    # Create default education levels if they don't exist
    default_education_levels = [
        'دكتوراه', 'ماجستير', 'بكالوريوس', 'دبلوم',
        'ثانوية عامة', 'إعدادية', 'ابتدائية', 'يقرأ ويكتب', 'أمي'
    ]
    
    existing_education_count = await db.education_levels.count_documents({})
    if existing_education_count == 0:
        for title in default_education_levels:
            level = EducationLevel(title=title)
            doc = level.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.education_levels.insert_one(doc)
        logger.info(f"Created {len(default_education_levels)} default education levels")
    
    # Ensure default admin user exists
    admin_exists = await db.users.find_one({"email": "admin@example.com"})
    if not admin_exists:
        admin_user = UserCreate(
            full_name="Admin User",
            email="admin@example.com",
            password="admin",
            role="admin"
        )
        hashed_password = get_password_hash(admin_user.password)
        user_obj = User(
            full_name=admin_user.full_name,
            email=admin_user.email,
            role=admin_user.role
        )
        user_dict = user_obj.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['password'] = hashed_password
        
        await db.users.insert_one(user_dict)
        logger.info("Created default admin user (admin@example.com / admin)")
    else:
        logger.info("Admin user exists (admin@example.com)")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()