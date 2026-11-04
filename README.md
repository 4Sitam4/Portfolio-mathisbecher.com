# Branche deploy

Branche suivie par la stack Portainer. Elle ne contient que `portainer-stack.yml`,
avec l'image de chaque build de `main` épinglée par son tag (`sha-xxxxxxx`) et son
empreinte (`sha256:…`).

La CI (`.github/workflows/docker.yml`, job `deploy-manifest`) la met à jour une
fois l'image publiée sur GHCR : Portainer voit un nouveau commit et tire
exactement cette image. Revenir à une version précédente = revenir à un commit
précédent de cette branche.

Le code et la stack de référence sont sur `main`.
