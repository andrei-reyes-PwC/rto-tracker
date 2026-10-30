import unittest
from datetime import date

from app.main import monthly_target_reply


class PlanningSettingsTest(unittest.TestCase):
    def reply(self, days_off):
        target = {
            "additional": False,
            "target_days": 1,
            "month_start": date(2026, 10, 1),
            "month_end": date(2026, 10, 31),
        }
        tools = {
            "get_my_office_schedule": {
                "daysOff": days_off,
                "monthlyTarget": {
                    "remainingDaysToRecommend": 1,
                    "savedDaysInTargetMonth": [],
                    "daysCountedTowardTarget": 0,
                    "month": "October 2026",
                },
            },
            "get_visible_events": {"events": []},
            "get_rto_member_counts": {"dailyCounts": []},
        }
        return monthly_target_reply(target, tools, date(2026, 10, 30))

    def test_blocked_saturday_is_excluded_even_when_no_weekdays_remain(self):
        reply = self.reply([6, 7])
        self.assertNotIn("Saturday, October 31", reply)
        self.assertIn("only 0", reply)

    def test_saturday_remains_a_fallback_when_it_is_not_a_day_off(self):
        self.assertIn("Saturday, October 31", self.reply([7]))


if __name__ == "__main__":
    unittest.main()
