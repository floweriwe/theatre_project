"""
Claude CLI Integration - Интеграция с Claude CLI для генерации кода
"""

import subprocess
import os
import json
from typing import Dict, Any, Optional


class ClaudeCliIntegration:
    """
    Интеграция с Claude CLI
    
    Использует установленный Claude CLI для генерации кода
    """
    
    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.claude_dir = os.path.join(project_dir, ".claude")
        self.agents_dir = os.path.join(self.claude_dir, "agents")
        self.memory_bank_dir = os.path.join(self.claude_dir, "memory-bank")
    
    def create_model(self, model_name: str, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Создать SQLAlchemy модель через Claude CLI
        
        Args:
            model_name: Имя модели (например "Department")
            file_path: Путь к файлу (например "backend/app/models/department.py")
            context: Контекст проекта
        
        Returns:
            {"success": bool, "output": str, "error": str}
        """
        
        # Агент для создания моделей
        agent = "database-architect"
        
        # Контекст из memory bank
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md",
            "03_DATABASE.md"
        ])
        
        # Промпт
        prompt = f"""
# ЗАДАЧА: Создать SQLAlchemy модель {model_name}

## Файл
{file_path}

## Требования
1. Используй SQLAlchemy 2.0+ (async)
2. Используй Mapped[] type hints
3. Следуй паттерну других моделей в проекте
4. Добавь __tablename__
5. Добавь relationships если нужно
6. Добавь docstring

## Контекст проекта
{memory_context}

## Существующие модели для референса
{self._get_existing_models()}

## Создай полноценный код модели
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        # Вызвать Claude CLI
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def create_schema(self, model_name: str, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Создать Pydantic схемы"""
        
        agent = "backend-architect"
        
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md"
        ])
        
        # Найти модель
        model_file = file_path.replace("schemas", "models").replace(model_name.lower(), model_name.lower())
        model_code = ""
        if os.path.exists(os.path.join(self.project_dir, model_file)):
            with open(os.path.join(self.project_dir, model_file), 'r', encoding='utf-8') as f:
                model_code = f.read()
        
        prompt = f"""
# ЗАДАЧА: Создать Pydantic схемы для модели {model_name}

## Файл
{file_path}

## Модель (для референса)
```python
{model_code}
```

## Требования
1. Используй Pydantic 2.0+
2. Создай схемы: {model_name}Base, {model_name}Create, {model_name}Update, {model_name}Response
3. Следуй паттерну других схем в проекте
4. Добавь field validators если нужно
5. Используй ConfigDict

## Контекст проекта
{memory_context}

## Существующие схемы для референса
{self._get_existing_schemas()}

## Создай полноценный код схем
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def create_repository(self, model_name: str, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Создать Repository"""
        
        agent = "python-pro"
        
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md"
        ])
        
        prompt = f"""
# ЗАДАЧА: Создать Repository для модели {model_name}

## Файл
{file_path}

## Требования
1. Наследуйся от BaseRepository
2. Используй async/await
3. Реализуй базовые CRUD методы (get, get_multi, create, update, delete)
4. Добавь специфичные методы если нужно
5. Следуй паттерну других репозиториев

## Контекст проекта
{memory_context}

## BaseRepository для референса
{self._get_base_repository()}

## Существующие репозитории для референса
{self._get_existing_repositories()}

## Создай полноценный код repository
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def create_service(self, model_name: str, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Создать Service"""
        
        agent = "backend-architect"
        
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md"
        ])
        
        prompt = f"""
# ЗАДАЧА: Создать Service для модели {model_name}

## Файл
{file_path}

## Требования
1. Используй соответствующий Repository
2. Реализуй бизнес-логику
3. Используй async/await
4. Добавь обработку ошибок
5. Следуй паттерну других сервисов

## Контекст проекта
{memory_context}

## Существующие сервисы для референса
{self._get_existing_services()}

## Создай полноценный код service
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def create_api_endpoints(self, model_name: str, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Создать API endpoints"""
        
        agent = "backend-architect"
        
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md",
            "06_API_SPECIFICATION.md"
        ])
        
        prompt = f"""
# ЗАДАЧА: Создать API endpoints для модели {model_name}

## Файл
{file_path}

## Требования
1. Используй FastAPI router
2. Реализуй CRUD endpoints: GET (list + detail), POST, PUT, DELETE
3. Используй соответствующий Service
4. Добавь permissions checks
5. Добавь response models
6. Следуй паттерну других API

## Контекст проекта
{memory_context}

## Существующие API endpoints для референса
{self._get_existing_api_endpoints()}

## Создай полноценный код API endpoints
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def edit_file(self, file_path: str, instruction: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Редактировать существующий файл
        
        Args:
            file_path: Путь к файлу
            instruction: Инструкция что изменить
            context: Контекст
        """
        
        full_path = os.path.join(self.project_dir, file_path)
        
        if not os.path.exists(full_path):
            return {"success": False, "error": f"File not found: {file_path}", "output": ""}
        
        # Прочитать текущий код
        with open(full_path, 'r', encoding='utf-8') as f:
            current_code = f.read()
        
        agent = self._select_agent_for_file(file_path)
        
        memory_context = self._load_memory_context([
            "00_PROJECT_INSTRUCTIONS.md",
            "02_ARCHITECTURE.md"
        ])
        
        prompt = f"""
# ЗАДАЧА: Редактировать файл {file_path}

## Инструкция
{instruction}

## Текущий код
```python
{current_code}
```

## Контекст проекта
{memory_context}

## Требования
1. Сохрани существующую структуру
2. Следуй стилю проекта
3. Не удаляй важный код
4. Добавь необходимые изменения

## Выведи обновлённый код
Выведи ТОЛЬКО код Python без markdown, без объяснений.
"""
        
        result = self._call_claude_cli(
            prompt=prompt,
            agent=agent,
            output_file=file_path
        )
        
        return result
    
    def _call_claude_cli(self, prompt: str, agent: str, output_file: str) -> Dict[str, Any]:
        """
        Вызвать Claude CLI
        
        Args:
            prompt: Промпт для Claude
            agent: Имя агента (без .md)
            output_file: Путь к выходному файлу (относительно project_dir)
        """
        
        try:
            # Сохранить промпт во временный файл
            temp_prompt_file = os.path.join(self.project_dir, ".night-mode", "temp_prompt.txt")
            os.makedirs(os.path.dirname(temp_prompt_file), exist_ok=True)
            
            with open(temp_prompt_file, 'w', encoding='utf-8') as f:
                f.write(prompt)
            
            # Путь к агенту
            agent_file = os.path.join(self.agents_dir, f"{agent}.md")
            
            if not os.path.exists(agent_file):
                return {
                    "success": False,
                    "error": f"Agent not found: {agent}",
                    "output": ""
                }
            
            # Команда Claude CLI
            # Формат: claude < prompt.txt > output.py
            # Или: cat prompt.txt | claude > output.py
            
            cmd = f'type "{temp_prompt_file}" | claude --agent "{agent_file}"'
            
            # Выполнить через PowerShell (Windows)
            result = subprocess.run(
                ["powershell", "-Command", cmd],
                cwd=self.project_dir,
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=120  # 2 минуты
            )
            
            output = result.stdout
            
            # Очистить markdown если есть
            output = self._clean_markdown(output)
            
            # Сохранить в файл
            full_path = os.path.join(self.project_dir, output_file)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(output)
            
            # Удалить временный файл
            os.remove(temp_prompt_file)
            
            return {
                "success": True,
                "output": output[:1000],  # Первые 1000 символов для лога
                "error": None
            }
        
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Claude CLI timeout (2 min)",
                "output": ""
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Claude CLI error: {str(e)}",
                "output": ""
            }
    
    def _clean_markdown(self, text: str) -> str:
        """Удалить markdown разметку из кода"""
        import re
        
        # Удалить ```python ... ```
        text = re.sub(r'^```python\n', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\n?$', '', text, flags=re.MULTILINE)
        text = re.sub(r'```$', '', text)
        
        return text.strip()
    
    def _load_memory_context(self, files: list) -> str:
        """Загрузить контекст из memory bank"""
        context = []
        
        for file in files:
            file_path = os.path.join(self.memory_bank_dir, file)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    context.append(f"## {file}\n{f.read()}\n")
        
        return "\n".join(context)
    
    def _get_existing_models(self) -> str:
        """Получить список существующих моделей"""
        models_dir = os.path.join(self.project_dir, "backend", "app", "models")
        
        if not os.path.exists(models_dir):
            return "No models found"
        
        models = []
        for file in os.listdir(models_dir):
            if file.endswith(".py") and file != "__init__.py":
                models.append(file.replace(".py", ""))
        
        return f"Existing models: {', '.join(models)}"
    
    def _get_existing_schemas(self) -> str:
        """Получить пример существующих схем"""
        schemas_dir = os.path.join(self.project_dir, "backend", "app", "schemas")
        
        # Взять inventory.py как пример
        example_file = os.path.join(schemas_dir, "inventory.py")
        if os.path.exists(example_file):
            with open(example_file, 'r', encoding='utf-8') as f:
                return f"Example (inventory.py):\n```python\n{f.read()[:1000]}\n```"
        
        return "No schemas found"
    
    def _get_base_repository(self) -> str:
        """Получить BaseRepository код"""
        base_file = os.path.join(self.project_dir, "backend", "app", "repositories", "base.py")
        
        if os.path.exists(base_file):
            with open(base_file, 'r', encoding='utf-8') as f:
                return f"```python\n{f.read()}\n```"
        
        return "BaseRepository not found"
    
    def _get_existing_repositories(self) -> str:
        """Получить пример репозиториев"""
        repos_dir = os.path.join(self.project_dir, "backend", "app", "repositories")
        
        example_file = os.path.join(repos_dir, "inventory_repository.py")
        if os.path.exists(example_file):
            with open(example_file, 'r', encoding='utf-8') as f:
                return f"Example (inventory_repository.py):\n```python\n{f.read()[:1000]}\n```"
        
        return "No repositories found"
    
    def _get_existing_services(self) -> str:
        """Получить пример сервисов"""
        services_dir = os.path.join(self.project_dir, "backend", "app", "services")
        
        example_file = os.path.join(services_dir, "inventory_service.py")
        if os.path.exists(example_file):
            with open(example_file, 'r', encoding='utf-8') as f:
                return f"Example (inventory_service.py):\n```python\n{f.read()[:1000]}\n```"
        
        return "No services found"
    
    def _get_existing_api_endpoints(self) -> str:
        """Получить пример API endpoints"""
        api_dir = os.path.join(self.project_dir, "backend", "app", "api", "v1")
        
        example_file = os.path.join(api_dir, "inventory.py")
        if os.path.exists(example_file):
            with open(example_file, 'r', encoding='utf-8') as f:
                return f"Example (inventory.py):\n```python\n{f.read()[:1500]}\n```"
        
        return "No API endpoints found"
    
    def _select_agent_for_file(self, file_path: str) -> str:
        """Выбрать агента в зависимости от типа файла"""
        if "/models/" in file_path:
            return "database-architect"
        elif "/schemas/" in file_path:
            return "backend-architect"
        elif "/repositories/" in file_path:
            return "python-pro"
        elif "/services/" in file_path:
            return "backend-architect"
        elif "/api/" in file_path:
            return "backend-architect"
        elif file_path.endswith(".tsx") or file_path.endswith(".ts"):
            return "frontend-developer"
        else:
            return "python-pro"


if __name__ == "__main__":
    # Тест
    integration = ClaudeCliIntegration("C:\\Work\\projects\\theatre\\theatre_app_2026")
    
    # Проверить доступность
    print("Memory bank:", os.path.exists(integration.memory_bank_dir))
    print("Agents dir:", os.path.exists(integration.agents_dir))
    
    # Тест создания модели
    # result = integration.create_model("Department", "backend/app/models/department.py", {})
    # print("\nResult:", result)
