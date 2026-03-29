import React, { useState } from 'react';
import { CustomDesign, Product, User, SavedCustomerDesign } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Palette, ExternalLink, Trash2, ShoppingCart, Edit3, Package, Link, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DesignCheckoutModal } from './DesignCheckoutModal';

interface SavedDesignsProps {
  user: User;
  products: Product[];
  onUpdate: (user: User) => void;
  onAddToCart: (productId: string, designUrl: string) => void;
  onEditDesign?: (designId: string, productId: string) => void;
}

export function SavedDesigns({ user, products, onUpdate, onAddToCart, onEditDesign }: SavedDesignsProps) {
  // Safety check for user
  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-dashed border-cyan-500/20 py-16">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center">
              <Palette className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Unable to load designs</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                Please log in to view your saved designs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combine both old and new designs
  const oldDesigns = user.savedDesigns || [];
  const studioDesigns = user.savedCustomerDesigns || [];
  const allDesigns = [...studioDesigns, ...oldDesigns];
  
  const [expandedDesign, setExpandedDesign] = useState<string | null>(null);

  const handleDeleteOldDesign = (designId: string) => {
    if (confirm('Are you sure you want to remove this design from your wishlist?')) {
      const updatedDesigns = oldDesigns.filter(d => d.id !== designId);
      const updatedUser = { ...user, savedDesigns: updatedDesigns };
      storageUtils.updateCurrentUser(updatedUser);
      onUpdate(updatedUser);
      toast.success('Design removed');
    }
  };

  const handleDeleteStudioDesign = (designId: string) => {
    if (confirm('Are you sure you want to remove this design from your studio?')) {
      const updatedDesigns = studioDesigns.filter(d => d.id !== designId);
      const updatedUser = { ...user, savedCustomerDesigns: updatedDesigns };
      storageUtils.updateCurrentUser(updatedUser);
      onUpdate(updatedUser);
      toast.success('Design removed');
    }
  };

  const handleEdit = (designUrl: string) => {
    window.open(designUrl, '_blank');
  };

  const getBaseProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const isStudioDesign = (design: any): design is SavedCustomerDesign => {
    return 'designUploads' in design && 'printingMethod' in design;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl border border-purple-500/30">
          <Palette className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">My Custom Designs</h2>
          <p className="text-slate-400">Your studio creations and saved designs</p>
        </div>
      </div>

      {allDesigns.length === 0 ? (
        <Card className="glass-card border-dashed border-cyan-500/20 py-16">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center">
              <Palette className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">No designs saved yet</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                Use our 2D Design Studio to create unique apparel and save them here for later.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {allDesigns.map((design) => {
              const product = getBaseProduct(design.productId);
              const isStudio = isStudioDesign(design);
              
              return (
                <motion.div
                  key={design.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="glass-card border-cyan-500/20 overflow-hidden group hover:border-cyan-500/40 transition-all">
                    <div className="aspect-[4/5] relative bg-[#0f172a]/50">
                      {/* Display thumbnail or product image */}
                      {(isStudio ? design.thumbnailUrl : product?.image) ? (
                        <ImageWithFallback
                          src={isStudio ? design.thumbnailUrl! : product!.image}
                          alt={design.name || 'Custom Design'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="rounded-full w-10 h-10 shadow-xl"
                          onClick={() => isStudio ? handleDeleteStudioDesign(design.id) : handleDeleteOldDesign(design.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                            {product?.category || design.category || 'Custom Product'}
                          </span>
                          {isStudio ? (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-[9px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1">
                              <Layers className="w-2 h-2" />
                              2D Studio
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                              3D Design
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-bold text-lg truncate">{design.name || 'Custom Design'}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          Designed on {new Date(design.createdAt).toLocaleDateString()}
                        </p>
                        {isStudio && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-cyan-400">
                              {design.color} • {design.size} • {design.fabric}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4 bg-[#0a0e1a]/80 backdrop-blur-md">
                      {isStudio ? (
                        // 2D Studio Design
                        <>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Printing Method</span>
                              <span className="text-cyan-400 font-bold">{design.printingMethod}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Printing Cost</span>
                              <span className="text-teal-400 font-bold">₹{design.printingCost}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Design Elements</span>
                              <span className="text-purple-400 font-bold">{design.designUploads?.length || 0}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                              onClick={() => onEditDesign && onEditDesign(design.id, design.productId)}
                            >
                              <Edit3 className="w-3 h-3 mr-2" />
                              Re-Edit
                            </Button>
                            <Button
                              size="sm"
                              disabled={design.approvalStatus !== 'approved'}
                              className={design.approvalStatus === 'approved' 
                                ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white border-0 rounded-xl shadow-lg"
                                : "bg-slate-700/50 text-slate-500 border-0 rounded-xl cursor-not-allowed"}
                              onClick={() => {
                                if (design.approvalStatus === 'approved') {
                                  if (product) {
                                    // Calculate total price: base product price + printing cost
                                    const basePrice = product.price || 0;
                                    const printingCost = design.printingCost || 0;
                                    const totalPrice = basePrice + printingCost;
                                    
                                    // Add custom design to cart with screenshot
                                    onAddToCart(design.productId, design.canvasSnapshot || design.thumbnailUrl || '');
                                    toast.success(`Added to cart! Total: ₹${totalPrice.toFixed(2)}`);
                                  } else {
                                    toast.error('Product not found');
                                  }
                                } else if (design.approvalStatus === 'rejected') {
                                  toast.error(design.approvalNotes || 'This design was rejected. Please check review notes and create a new design.');
                                } else {
                                  toast.info('This design is pending admin approval before purchase.');
                                }
                              }}
                            >
                              <ShoppingCart className="w-3 h-3 mr-2" />
                              {design.approvalStatus === 'approved' ? 'Buy Now' : 
                               design.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Old 3D Design
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                              onClick={() => handleEdit((design as CustomDesign).designUrl)}
                            >
                              <Edit3 className="w-3 h-3 mr-2" />
                              Edit Design
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white border-0 rounded-xl shadow-lg"
                              onClick={() => onAddToCart(design.productId, (design as CustomDesign).designUrl)}
                            >
                              <ShoppingCart className="w-3 h-3 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                          
                          {/* Design URL Info */}
                          {(design as CustomDesign).designUrl && (
                            <div className="mt-3 pt-3 border-t border-slate-800">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-slate-400 hover:text-cyan-400 justify-start px-2"
                                onClick={() => setExpandedDesign(expandedDesign === design.id ? null : design.id)}
                              >
                                <Link className="w-3 h-3 mr-2" />
                                {expandedDesign === design.id ? 'Hide' : 'View'} Design URL
                              </Button>
                              
                              <AnimatePresence>
                                {expandedDesign === design.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 p-2 bg-black/30 rounded-lg border border-purple-500/20">
                                      <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-1">Permanent Design Link:</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-300 font-mono break-all flex-1">{(design as CustomDesign).designUrl}</p>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 flex-shrink-0"
                                          onClick={() => {
                                            navigator.clipboard.writeText((design as CustomDesign).designUrl);
                                            toast.success('Design URL copied!');
                                          }}
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}