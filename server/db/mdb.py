from __future__ import annotations

from datetime import datetime
from typing import cast

import attrs

from server.db.models import Algorithm
from server.db.models import Event
from server.db.models import ScriptDemoInfo
from server.db.models import User
from server.db.models import UserId
from server.db.protocol import DatabaseProtocol


@attrs.define
class MemoryDatabase(DatabaseProtocol):
    """A database based on Google DataStore."""

    users: dict[UserId, User] = attrs.field(factory=dict)
    algos: dict[str, Algorithm] = attrs.field(factory=dict)

    def get_user(self, user_id: UserId) -> User | None:
        return self.users.get(user_id)

    def save_user(self, user: User) -> None:
        self.users[user.firebase_user_id] = user

    @staticmethod
    def _make_algo_key(author_id: UserId, algo_name: str) -> str:
        return str(author_id) + ":" + algo_name

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_id, name)
        return self.algos.get(algo_key)

    def save_algo(self, algo: Algorithm) -> None:
        algo_key = self._make_algo_key(algo.author.firebase_user_id, algo.name)
        algo.last_updated = datetime.now()
        self.algos[algo_key] = algo

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        return [
            algo.name
            for algo in self.algos.values()
            if algo.author.firebase_user_id == author_id
        ]

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        return [
            ScriptDemoInfo.from_algorithm(algo)
            for algo in self.algos.values()
            if algo.public is True
        ]

    @classmethod
    def with_fake_entries(cls) -> MemoryDatabase:
        user_id = "userid_f00barf00"
        user = User(user_id, "stephendause@gmail.com")
        algo = Algorithm(
            author=user,
            name="foo",
            algo_script="# algo_script",
            viz_script="# viz_script",
            public=False,
        )
        algo_key = cls._make_algo_key(user_id, "foo")

        cached_events = [
            {
                "lineno": 1,
                "viz_output": "",
                "viz_log": "Error executing script at line 4.name 'x' is not defined",
                "algo_log": "",
            },
            {
                "lineno": 2,
                "viz_output": "",
                "viz_log": "Error executing script at line 4.name 'x' is not defined",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "",
                "viz_log": "Error executing script at line 4.name 'y' is not defined",
                "algo_log": "",
            },
            {
                "lineno": 4,
                "viz_output": "",
                "viz_log": "Error executing script at line 4.name 'n' is not defined",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,50,'x=50 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,50,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,50,'x=50 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,50,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "n 1.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,100,'x=50 y=100 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,50,100,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,100,'x=50 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,50,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,100,'x=50 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,50,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "n 2.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,150,'x=50 y=150 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,50,150,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,150,'x=50 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,50,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,150,'x=50 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,50,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "n 3.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,200,'x=50 y=200 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,50,200,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,200,'x=50 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,50,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,200,'x=50 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,50,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "n 4.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,250,'x=50 y=250 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,50,250,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,250,'x=50 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,50,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,250,'x=50 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,50,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "n 5.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,300,'x=50 y=300 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,50,300,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,300,'x=50 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,50,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,300,'x=50 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,50,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "n 6.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,350,'x=50 y=350 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,50,350,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,350,'x=50 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,50,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,350,'x=50 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,50,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "n 7.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,400,'x=50 y=400 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,50,400,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,400,'x=50 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,50,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,400,'x=50 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,50,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "n 8.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 50,450,'x=50 y=450 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,50,450,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 50,450,'x=50 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,50,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 50,450,'x=50 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,50,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "n 9.0\n",
            },
            {
                "lineno": 2,
                "viz_output": "T(canvas, 50,450,'x=50 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,50,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,450,'x=100 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,100,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,50,'x=100 y=50 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,100,50,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,50,'x=100 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,100,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,50,'x=100 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,100,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "n 1.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,100,'x=100 y=100 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,100,100,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,100,'x=100 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,100,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,100,'x=100 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,100,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "n 2.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,150,'x=100 y=150 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,100,150,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,150,'x=100 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,100,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,150,'x=100 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,100,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "n 3.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,200,'x=100 y=200 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,100,200,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,200,'x=100 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,100,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,200,'x=100 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,100,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "n 4.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,250,'x=100 y=250 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,100,250,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,250,'x=100 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,100,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,250,'x=100 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,100,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "n 5.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,300,'x=100 y=300 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,100,300,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,300,'x=100 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,100,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,300,'x=100 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,100,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "n 6.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,350,'x=100 y=350 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,100,350,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,350,'x=100 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,100,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,350,'x=100 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,100,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "n 7.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,400,'x=100 y=400 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,100,400,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,400,'x=100 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,100,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,400,'x=100 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,100,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "n 8.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 100,450,'x=100 y=450 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,100,450,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 100,450,'x=100 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,100,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 100,450,'x=100 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,100,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "n 9.0\n",
            },
            {
                "lineno": 2,
                "viz_output": "T(canvas, 100,450,'x=100 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,100,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,450,'x=150 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,150,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,50,'x=150 y=50 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,150,50,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,50,'x=150 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,150,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,50,'x=150 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,150,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "n 1.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,100,'x=150 y=100 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,150,100,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,100,'x=150 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,150,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,100,'x=150 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,150,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "n 2.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,150,'x=150 y=150 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,150,150,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,150,'x=150 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,150,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,150,'x=150 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,150,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "n 3.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,200,'x=150 y=200 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,150,200,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,200,'x=150 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,150,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,200,'x=150 y=200 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,150,200,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "n 4.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,250,'x=150 y=250 n=4',22,'Arial','red');R(canvas, 450,50,90.0,90.0,'brown','lightyellow');L(canvas, 50,50,150,250,'purple',6);C(canvas, 300,200,100.0,'transparent','green');A(canvas, 100,325,50,100,2.6927937030769655,3.5903916041026207,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,250,'x=150 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,150,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,250,'x=150 y=250 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,150,250,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "n 5.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,300,'x=150 y=300 n=5',25,'Arial','red');R(canvas, 450,50,100.0,100.0,'brown','lightyellow');L(canvas, 50,50,150,300,'purple',6);C(canvas, 300,200,125.0,'transparent','green');A(canvas, 100,325,50,100,3.5903916041026207,4.487989505128276,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,300,'x=150 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,150,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,300,'x=150 y=300 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,150,300,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "n 6.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,350,'x=150 y=350 n=6',28,'Arial','red');R(canvas, 450,50,110.0,110.0,'brown','lightyellow');L(canvas, 50,50,150,350,'purple',6);C(canvas, 300,200,150.0,'transparent','green');A(canvas, 100,325,50,100,4.487989505128276,5.385587406153931,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,350,'x=150 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,150,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,350,'x=150 y=350 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,150,350,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "n 7.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,400,'x=150 y=400 n=7',31,'Arial','red');R(canvas, 450,50,120.0,120.0,'brown','lightyellow');L(canvas, 50,50,150,400,'purple',6);C(canvas, 300,200,175.0,'transparent','green');A(canvas, 100,325,50,100,5.385587406153931,6.283185307179586,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,400,'x=150 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,150,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,400,'x=150 y=400 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,150,400,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "n 8.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 150,450,'x=150 y=450 n=8',34,'Arial','red');R(canvas, 450,50,130.0,130.0,'brown','lightyellow');L(canvas, 50,50,150,450,'purple',6);C(canvas, 300,200,200.0,'transparent','green');A(canvas, 100,325,50,100,6.283185307179586,7.180783208205241,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 150,450,'x=150 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,150,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 150,450,'x=150 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,150,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "n 9.0\n",
            },
            {
                "lineno": 2,
                "viz_output": "T(canvas, 150,450,'x=150 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,150,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 200,450,'x=200 y=450 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,200,450,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 200,50,'x=200 y=50 n=9',37,'Arial','red');R(canvas, 450,50,140.0,140.0,'brown','lightyellow');L(canvas, 50,50,200,50,'purple',6);C(canvas, 300,200,225.0,'transparent','green');A(canvas, 100,325,50,100,7.180783208205241,8.078381109230897,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 200,50,'x=200 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,200,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 200,50,'x=200 y=50 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,200,50,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "n 1.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 200,100,'x=200 y=100 n=1',13,'Arial','red');R(canvas, 450,50,60.0,60.0,'brown','lightyellow');L(canvas, 50,50,200,100,'purple',6);C(canvas, 300,200,25.0,'transparent','green');A(canvas, 100,325,50,100,0.0,0.8975979010256552,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 200,100,'x=200 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,200,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 200,100,'x=200 y=100 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,200,100,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "n 2.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 200,150,'x=200 y=150 n=2',16,'Arial','red');R(canvas, 450,50,70.0,70.0,'brown','lightyellow');L(canvas, 50,50,200,150,'purple',6);C(canvas, 300,200,50.0,'transparent','green');A(canvas, 100,325,50,100,0.8975979010256552,1.7951958020513104,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 5,
                "viz_output": "T(canvas, 200,150,'x=200 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,200,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
            {
                "lineno": 3,
                "viz_output": "T(canvas, 200,150,'x=200 y=150 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,200,150,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "n 3.0\n",
            },
            {
                "lineno": 4,
                "viz_output": "T(canvas, 200,200,'x=200 y=200 n=3',19,'Arial','red');R(canvas, 450,50,80.0,80.0,'brown','lightyellow');L(canvas, 50,50,200,200,'purple',6);C(canvas, 300,200,75.0,'transparent','green');A(canvas, 100,325,50,100,1.7951958020513104,2.6927937030769655,'orange');",
                "viz_log": "",
                "algo_log": "",
            },
        ]
        algo_2 = Algorithm(
            author=user,
            name="foo",
            algo_script="# algo_script 2",
            viz_script="# viz_script 2",
            public=True,
            cached_events=cast(list[Event], cached_events),
        )
        algo_key_2 = cls._make_algo_key(user_id, "foo")

        return cls({user_id: user}, {algo_key: algo, algo_key_2: algo_2})
