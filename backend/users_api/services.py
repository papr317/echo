import logging
from pathlib import Path
import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent / "nickname_model.joblib"
_MODEL = None
_POSITIVE_INDEX = None

def _load_model():
    global _MODEL, _POSITIVE_INDEX
    if _MODEL is not None:
        return _MODEL
    if not MODEL_PATH.exists():
        logger.warning("Модель не найдена: %s", MODEL_PATH)
        return None
    try:
        _MODEL = joblib.load(MODEL_PATH)
        # Определяем индекс положительного класса для predict_proba
        classes = getattr(_MODEL, "classes_", None)
        if classes is not None:
            # пытаемся найти метку 1 или True как положительную
            for target in (1, "1", True, "true", "toxic", "yes"):
                if target in classes:
                    _POSITIVE_INDEX = list(classes).index(target)
                    break
            # если не нашли, считаем, что последний класс — положительный
            if _POSITIVE_INDEX is None:
                _POSITIVE_INDEX = len(classes) - 1
        logger.info("Модель загружена: %s, positive_index=%s", MODEL_PATH, _POSITIVE_INDEX)
        return _MODEL
    except Exception as e:
        logger.exception("Ошибка загрузки модели: %s", e)
        return None

def check_nickname_toxicity(nickname: str):
    """
    Возвращает (is_toxic: bool, probability: float|None, debug: dict)
    """
    nickname = (nickname or "").strip()
    model = _load_model()
    debug = {"model_path": str(MODEL_PATH), "nickname": nickname}
    if model is None:
        debug["error"] = "model_not_found"
        # Рекомендуется: если модель отсутствует — считать ник небезопасным.
        return True, None, debug

    try:
        # Предобработка: минимальная (strip), можно добавить lower() или нормализацию
        X = [nickname]

        # Если модель поддерживает predict_proba, используем вероятность
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)
            if _POSITIVE_INDEX is None:
                # положительный индекс как последний
                pos_idx = proba.shape[1] - 1
            else:
                pos_idx = _POSITIVE_INDEX
            p = float(proba[0, pos_idx])
            is_toxic = p >= 0.5
            debug.update({"method": "predict_proba", "probability": p, "pos_idx": pos_idx})
            return bool(is_toxic), p, debug

        # иначе используем predict (предполагается 0/1)
        pred = model.predict(X)[0]
        # приводим предсказание к булеву
        is_toxic = bool(int(pred))
        debug.update({"method": "predict", "raw_prediction": pred})
        return is_toxic, None, debug
    except Exception as e:
        logger.exception("Ошибка при предсказании: %s", e)
        debug["exception"] = str(e)
        # при ошибке по безопасности считаем токсичным
        return True, None, debug

