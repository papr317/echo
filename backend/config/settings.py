import os
from pathlib import Path
from datetime import timedelta
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# .env file should contain the following variables:
SECRET_KEY = config('SECRET_KEY')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# автоматически добавлять / в конце URL
APPEND_SLASH = True

ALLOWED_HOSTS = ['*']

AUTH_USER_MODEL = 'users_api.CustomUser'

ASGI_APPLICATION = 'backend.config.asgi.application'

INSTALLED_APPS = [
    'daphne',         # ASGI-сервер
    'channels',       # Django Channels
    'corsheaders',
    'rest_framework',  # Django REST Framework for API development
    'rest_framework_simplejwt',  # JWT authentication
    'django_q', # таймер
    'django_redis', # кэширование
    'import_export', # импорт экспорт в админке

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'backend.users_api',
    'backend.echo_api',
    'backend.friends_api',
    'backend.messenger_api',
    # 'subscription_api', # подписки на пользователей
]
    

# жизненный цикл токенов
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=16),
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React
    "https://echo.su",  # твой фронт
]

CSRF_TRUSTED_ORIGINS = ['http://localhost:3000']

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# Конфигурация слоев каналов (Channel Layers)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.pubsub.RedisPubSubChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],  # Убедитесь, что Redis запущен на этом порту
        },
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        # Используем тот же хост и порт, что и для Channels. 
        # '/1' указывает на базу данных Redis под номером 1, чтобы отделить кэш от Channels (который обычно использует /0)
        'LOCATION': 'redis://127.0.0.1:6379/1', 
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            # Установим таймаут по умолчанию на 1 час (3600 секунд)
            'TIMEOUT': 3600, 
        },
    }
}

ROOT_URLCONF = 'backend.config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# основная база данных PostgreSQL
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}

MONGODB_DATABASE = {
    'host': config('MONGODB_HOST', default='localhost'), 
    
    'port': config('MONGODB_PORT', default=27017, cast=int), 
    'name': config('MONGODB_NAME', default='echo_messenger'), 
    
    'username': config('MONGODB_USER', default=''),
    'password': config('MONGODB_PASS', default=''),
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'ru-RU'

TIME_ZONE = 'Asia/Oral'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Настройки жизненного цикла постов и комментариев (в часах)
POST_LIFETIME_HOURS = 24       # Пост живет 24 часа
COMMENT_LIFETIME_HOURS = 240   # Коммент живет 10 дней
ECHO_EXTEND_HOURS = 1          # Лайк поста продлевает жизнь на 1 час
DISECHO_REDUCE_HOURS = 1       # Дизлайк поста уменьшает жизнь на 1 час

COMMENT_ECHO_EXTEND_HOURS = 10    # Лайк комментария продлевает жизнь на 10 часов
COMMENT_DISECHO_REDUCE_HOURS = 10 # Дизлайк комментария уменьшает жизнь на 10 часов

# валидатор пароля 
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        # Минимальная длина пароля - 6 символов
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# --- КОНФИГУРАЦИЯ DJANGO-Q ---
Q_CLUSTER = {
    'name': 'DjangOQ',
    'workers': 4, # Количество рабочих процессов
    'timeout': 90, # Таймаут задачи
    'retry': 120,  # Повтор через 120 секунд, если задача не удалась

    'orm': 'default',
    'schedule': [
        # Наш "будильник" для спасения комментариев
        {
            'name': 'float_expired_posts',
            'func': 'echo_api.tasks.check_and_float_expired_posts', 
            'minutes': 60, # Запускать каждые 60 минут (1 час)
            'repeats': -1, # Повторять бесконечно
        }
    ]
}