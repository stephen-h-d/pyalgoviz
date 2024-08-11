# from typing import Optional
#
# import attrs
# from google.cloud.firestore import Client as FirestoreClient
# from main.db.models import Algorithm
# from main.db.models import AlgorithmSummary
# from main.db.models import Event
# from main.db.models import ScriptDemoInfo
# from main.db.models import User
# from main.db.models import UserId
# from main.db.protocol import DatabaseProtocol
# from main.db.protocol import SaveAlgorithmArgs
#
#
# class FirestoreDatabase(DatabaseProtocol):
#     def __init__(self):
#         self.db = FirestoreClient()
#
#     def get_user(self, user_id: UserId) -> Optional[User]:
#         doc_ref = self.db.collection("users").document(user_id)
#         doc = doc_ref.get()
#         if doc.exists:
#             data = doc.to_dict()
#             return User(firebase_user_id=user_id, email=data["email"])
#         return None
#
#     def save_user(self, user: User) -> None:
#         doc_ref = self.db.collection("users").document(user.firebase_user_id)
#         doc_ref.set({"email": user.email})
#
#     def get_algo(self, author_id: UserId, name: str) -> Optional[Algorithm]:
#         doc_ref = self.db.collection("algorithms").document(f"{author_id}_{name}")
#         doc = doc_ref.get()
#         if doc.exists:
#             data = doc.to_dict()
#             author = self.get_user(author_id)
#             if not author:
#                 return None
#             cached_events = [Event(**event) for event in data["cached_events"]]
#             return Algorithm(
#                 author=author,
#                 name=name,
#                 algo_script=data["algo_script"],
#                 viz_script=data["viz_script"],
#                 public=data["public"],
#                 cached_events=cached_events,
#                 last_updated=data["last_updated"],
#             )
#         return None
#
#     def save_algo(self, algo: SaveAlgorithmArgs) -> None:
#         doc_ref = self.db.collection("algorithms").document(
#             f"{algo.author.firebase_user_id}_{algo.name}"
#         )
#         doc_ref.set(
#             {
#                 "author_email": algo.author.email,
#                 "name": algo.name,
#                 "algo_script": algo.algo_script,
#                 "viz_script": algo.viz_script,
#                 "public": algo.public,
#                 "cached_events": [attrs.asdict(event) for event in algo.cached_events],
#                 "last_updated": firestore.SERVER_TIMESTAMP,
#             }
#         )
#
#     def get_algo_summaries(self, author_id: UserId) -> list[AlgorithmSummary]:
#         algos_ref = self.db.collection("algorithms").where(
#             "author_email", "==", author_id
#         )
#         docs = algos_ref.stream()
#         summaries = []
#         for doc in docs:
#             data = doc.to_dict()
#             summaries.append(
#                 AlgorithmSummary(author_email=author_id, name=data["name"])
#             )
#         return summaries
#
#     def get_public_algos(self) -> list[ScriptDemoInfo]:
#         algos_ref = self.db.collection("algorithms").where("public", "==", True)
#         docs = algos_ref.stream()
#         public_algos = []
#         for doc in docs:
#             data = doc.to_dict()
#             cached_events = [Event(**event) for event in data["cached_events"]]
#             public_algos.append(
#                 ScriptDemoInfo(
#                     author_email=data["author_email"],
#                     name=data["name"],
#                     cached_events=cached_events,
#                 )
#             )
#         return public_algos
