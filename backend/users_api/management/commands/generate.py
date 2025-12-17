import re
import random
import pandas as pd
from django.core.management.base import BaseCommand
from backend.users_api.models import NicknameDataset

class Command(BaseCommand):
    help = "Генерация токсичных никнеймов на основе Leet Speak и сохранение в БД"

    def handle(self, *args, **options):
        self.stdout.write("Начало генерации данных...")

        # 1. Списки плохих слов
        en_bad = [
            'nigger', 'coon', 'kike', 'spic', 'chink', 'gook', 'wop', 'dago', 'kraut', 'jap',
            'faggot', 'dyke', 'tranny', 'queer', 'homo', 'pedo', 'retard', 'cripple', 'mongoloid', 'spaz',
            'nazi', 'hitler', 'ss', 'aryan', 'holocaustdenier', 'whitepower', 'kkk', 'swastika', 'gestapo', 'fuhrer',
            'slut', 'whore', 'cunt', 'bitch', 'bastard', 'asshole', 'dickhead', 'motherfucker', 'cocksucker', 'wanker','negr', 'niger'
        ]

        ru_bad = [
            'пидор', 'гомик', 'жид', 'хохол', 'чурка', 'черножопый', 'хач', 'нерусский', 'москаль', 'кацап',
            'дебил', 'идиот', 'даун', 'урод', 'выродок', 'нацист', 'фашист', 'гитлер', 'сс', 'свастика',
            'блядь', 'сука', 'пизда', 'хуй', 'еблан', 'долбоеб', 'мудак', 'пиздюк', 'хуесос', 'пиздолиз','негр'
        ]

        cn_bad = [
            '黑鬼', '鬼子', '支那', '小日本', '死妈', '操你祖宗', '王八蛋', '龟孙子', '傻逼', '脑残',
            '贱人', '婊子', '畜生', '人渣', '下贱', '智障', '煞笔', '屌丝', '狗日的', '妈的',
            '纳粹', '希特勒', '党卫军', '万字旗', '白人至上', '种族灭绝', '犹太杀手', '法西斯', '元首', '盖世太保'
        ]

        # 2. Карта Leet Speak
        leet_map = {
            'a': ['@', '4'], 'b': ['8'], 'c': ['('], 'd': ['|)'], 'e': ['3', '€'],
            'f': ['|='], 'g': ['9'], 'h': ['#'], 'i': ['1', '!'], 'o': ['0'],
            'p': ['|*'], 's': ['5', '$'], 't': ['7', '+'], 'u': ['|_|'], 'x': ['%']
        }

        def generate_leet(word):
            variations = [word.lower()]
            for char, repls in leet_map.items():
                new_vars = []
                for var in variations:
                    for repl in repls:
                        if char in var:
                            new_vars.append(re.sub(char, repl, var, flags=re.IGNORECASE))
                variations.extend(new_vars)
            return list(set(variations))

        suffixes = ['', 'Pro', 'King', '69', '228', '1488', 'X', '_Pro', 'Eater', 'Gnojnyi']
        languages = {'en': en_bad, 'ru': ru_bad, 'cn': cn_bad}
        
        count = 0
        
        # 3. Основной цикл генерации
        for lang, bad_list in languages.items():
            for word in bad_list:
                leets = generate_leet(word)
                # Берем до 5 вариаций на слово, чтобы не раздувать БД мусором
                for leet in leets[:5]:
                    for suffix in suffixes[:5]:
                        nick = leet.capitalize() + str(suffix)
                        
                        # Сохраняем сразу в базу данных Django
                        obj, created = NicknameDataset.objects.get_or_create(
                            nickname=nick,
                            defaults={'is_toxic': True}
                        )
                        if created:
                            count += 1

        self.stdout.write(self.style.SUCCESS(f"Успешно добавлено {count} новых никнеймов в БД."))