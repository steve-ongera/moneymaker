import asyncio

from django.core.management.base import BaseCommand

from api.game_engine import engine


class Command(BaseCommand):
    help = "Runs the MoneyMaker Aviator authoritative round engine (long-running process)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Aviator round engine..."))
        try:
            asyncio.run(engine.run_forever())
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Engine stopped."))
