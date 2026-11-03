# Profil secret-en-ligne (fixture rouge de verifier-profils, règles P12 et P13)

Profil fictif non conforme : il reprend l'état d'avant TF-2112 du profil azure. Trois contrôles
écrivent un identifiant en clair dans la ligne (P12), dont l'un envoie en plus un appel facturé
au déploiement d'un fournisseur de modèle sans mention d'accord du client (P13).
