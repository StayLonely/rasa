from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction


class ActionSubmitBooking(Action):
    def name(self) -> str:
        return "action_submit_booking"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: dict) -> list:

        name = tracker.get_slot("name")
        service = tracker.get_slot("service")

        print(f"DEBUG: Name slot = {name}, Service slot = {service}")

        # Если оба слота заполнены - завершаем запись
        if name and service:
            dispatcher.utter_message(
                text=f"Отлично, {name}! Вы записаны на {service}. Мы свяжемся с вами для подтверждения."
            )
            # Очищаем слоты для следующего диалога
            return [SlotSet("name", None), SlotSet("service", None)]

        # Если есть услуга, но нет имени - спрашиваем имя
        elif service and not name:
            dispatcher.utter_message(text="Как вас зовут?")
            return []

        # Если есть имя, но нет услуги - спрашиваем услугу
        elif name and not service:
            dispatcher.utter_message(text="На какую услугу вы хотите записаться?")
            return []

        # Если ничего нет - начинаем сначала
        else:
            dispatcher.utter_message(text="На какую услугу вы хотите записаться?")
            return []