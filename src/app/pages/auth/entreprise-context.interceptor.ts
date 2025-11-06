import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EntrepriseContextService } from '../crud/entreprise/entreprise-context.service';

export const entrepriseContextInterceptor: HttpInterceptorFn = (req, next) => {
  const contextService = inject(EntrepriseContextService);
  
  // ✅ Si CM avec entreprise sélectionnée, ajouter entreprise_id aux requêtes
  if (contextService.isCommunityManagerMode()) {
    const entrepriseId = contextService.getActiveEntrepriseId();
    
    if (entrepriseId) {
      // Ajouter entreprise_id aux requêtes GET (query params)
      if (req.method === 'GET') {
        const modifiedReq = req.clone({
          setParams: { entreprise_id: entrepriseId.toString() }
        });
        console.log('🔧 Requête GET modifiée (CM):', modifiedReq.url);
        return next(modifiedReq);
      }
      
      // ✅ CORRIGÉ : Gérer FormData et JSON différemment
      if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        
        // ✅ Si le body est un FormData (upload de fichiers)
        if (req.body instanceof FormData) {
          const formData = req.body as FormData;
          
          // ✅ Vérifier si entreprise_id n'est pas déjà dans le FormData
          if (!formData.has('entreprise_id')) {
            formData.append('entreprise_id', entrepriseId.toString());
            console.log('🔧 FormData modifié (CM) - entreprise_id ajouté:', entrepriseId);
          } else {
            console.log('ℹ️ FormData contient déjà entreprise_id:', formData.get('entreprise_id'));
          }
          
          const modifiedReq = req.clone({ body: formData });
          return next(modifiedReq);
        }
        
        // ✅ Si le body est un objet JSON classique
        else if (typeof req.body === 'object') {
          const modifiedBody = {
            ...req.body,
            entreprise_id: entrepriseId
          };
          const modifiedReq = req.clone({ body: modifiedBody });
          console.log('🔧 Body JSON modifié (CM):', modifiedBody);
          return next(modifiedReq);
        }
      }
    }
  }
  
  return next(req);
};