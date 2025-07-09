const logger = require("../config/logger");
const Premium = require('../models/premium');

// GET - Récupérer tous les premiums
exports.getAllPremiums = async (req, res) => {
  try {
    const premiums = await Premium.find();
    res.status(200).json(premiums);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des premiums',
      error: error.message
    });
  }
};

// GET - Récupérer un premium par ID
exports.getPremiumById = async (req, res) => {
  try {
    const premium = await Premium.findById(req.params.id);
    
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé'
      });
    }
    
    res.status(200).json(premium);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du premium',
      error: error.message
    });
  }
};

// POST - Créer un nouveau premium
exports.createPremium = async (req, res) => {
  try {
    const premium = new Premium(req.body);
    const savedPremium = await premium.save();
    
    res.status(201).json(savedPremium);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du premium',
      error: error.message
    });
  }
};

// PUT - Mettre à jour un premium par ID
exports.updatePremium = async (req, res) => {
    try {
        const premium = await Premium.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true,
                runValidators: true 
            }
        );
        
        if (!premium) {
            return res.status(404).json({
                success: false,
                message: 'Premium non trouvé'
            });
        }
        
        res.status(200).json(premium);

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la mise à jour du premium',
            error: error.message
        });
    }
};

// PATCH - Mise à jour partielle d'un premium
exports.patchPremium = async (req, res) => {
  try {
    const premium = await Premium.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { 
        new: true,
        runValidators: true 
      }
    );
    
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé'
      });
    }
    
    res.status(200).json(premium);

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour partielle du premium',
      error: error.message
    });
  }
};

// DELETE - Supprimer un premium par ID
exports.deletePremium = async (req, res) => {
  try {
    const premium = await Premium.findByIdAndDelete(req.params.id);
    
    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium non trouvé'
      });
    }
    
    res.status(200).json(premium);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du premium',
      error: error.message
    });
  }
};

// GET - Recherche avec pagination et filtres
// exports.searchPremiums = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, ...filters } = req.query;
//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       sort: { createdAt: -1 }
//     };
    
//     const premiums = await Premium.paginate(filters, options);
    
//     res.status(200).json({
//       success: true,
//       data: premiums
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Erreur lors de la recherche des premiums',
//       error: error.message
//     });
//   }
// };