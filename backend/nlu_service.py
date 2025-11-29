import re
import yaml
import os
from typing import Dict, Any, List

from backend.nlu_models import NLUData, Intent, Entity, IntentExample, EntityExample


class NLUService:
    def __init__(self):
        pass

    def parse_entity_from_text(self, text: str) -> List[EntityExample]:
        """Парсинг размеченных сущностей из текста в формате Rasa [value](entity)"""
        entities = []
        pattern = r'\[(.*?)\]\((.*?)\)'

        position_offset = 0
        for match in re.finditer(pattern, text):
            value, entity_type = match.groups()
            start = match.start() - position_offset
            end = start + len(value)

            entities.append(EntityExample(
                value=value,
                entity=entity_type,
                start=start,
                end=end
            ))

            # Увеличиваем смещение для учета удаленных скобок
            position_offset += len(match.group(0)) - len(value)

        return entities

    def extract_text_from_example(self, example: str) -> str:
        """Извлекает чистый текст из примера с сущностями"""
        # Удаляем разметку сущностей [value](entity)
        text = re.sub(r'\[(.*?)\]\((.*?)\)', r'\1', example)
        return text.strip()

    def load_nlu_data(self, nlu_file_path: str) -> NLUData:
        """Загрузка NLU данных из YAML файла"""
        if not os.path.exists(nlu_file_path):
            return NLUData(intents=[], entities=[])

        with open(nlu_file_path, 'r', encoding='utf-8') as file:
            nlu_content = yaml.safe_load(file)

        intents = []
        entities = []

        if nlu_content and 'nlu' in nlu_content:
            for item in nlu_content['nlu']:
                if 'intent' in item:
                    intent_name = item['intent']
                    examples = []

                    for example_text in item.get('examples', '').split('\n'):
                        example_text = example_text.strip().lstrip('-').strip()
                        if example_text:
                            entities_list = self.parse_entity_from_text(example_text)
                            clean_text = self.extract_text_from_example(example_text)

                            examples.append(IntentExample(
                                text=clean_text,
                                entities=entities_list
                            ))

                    intents.append(Intent(
                        name=intent_name,
                        examples=examples
                    ))

        return NLUData(intents=intents, entities=entities)

    def save_nlu_data(self, nlu_file_path: str, nlu_data: NLUData) -> bool:
        """Сохранение NLU данных в YAML файл"""
        try:
            nlu_content = {'nlu': []}

            for intent in nlu_data.intents:
                examples_text = []
                for example in intent.examples:
                    example_line = example.text
                    # Восстанавливаем разметку сущностей
                    for entity in sorted(example.entities, key=lambda x: x.start, reverse=True):
                        entity_markup = f"[{entity.value}]({entity.entity})"
                        example_line = example_line[:entity.start] + entity_markup + example_line[entity.end:]

                    examples_text.append(f"- {example_line}")

                nlu_content['nlu'].append({
                    'intent': intent.name,
                    'examples': '\n'.join(examples_text)
                })

            # Создаем директорию если не существует
            os.makedirs(os.path.dirname(nlu_file_path), exist_ok=True)

            with open(nlu_file_path, 'w', encoding='utf-8') as file:
                yaml.dump(nlu_content, file, allow_unicode=True, default_flow_style=False)

            return True

        except Exception as e:
            print(f"Error saving NLU data: {e}")
            return False

    def load_domain_data(self, domain_file_path: str) -> Dict[str, Any]:
        """Загрузка domain данных для проверки целостности"""
        if not os.path.exists(domain_file_path):
            return {}

        with open(domain_file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)

    def update_domain_intents(self, domain_file_path: str, intents: List[Intent]) -> bool:
        """Обновление интентов в domain.yml"""
        try:
            domain_data = self.load_domain_data(domain_file_path)
            if not domain_data:
                domain_data = {'version': '3.1', 'intents': []}

            # Обновляем список интентов
            domain_data['intents'] = [intent.name for intent in intents]

            with open(domain_file_path, 'w', encoding='utf-8') as file:
                yaml.dump(domain_data, file, allow_unicode=True, default_flow_style=False)

            return True

        except Exception as e:
            print(f"Error updating domain: {e}")
            return False