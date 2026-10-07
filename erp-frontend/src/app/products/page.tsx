'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
  status: string;
  category: {
    id: number;
    name: string;
  };
  supplier: {
    id: number;
    name: string;
  } | null;
};

type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(true);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  const [message, setMessage] = useState('');

  const fetchProducts = () => {
    fetch('http://localhost:8080/api/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    fetch('http://localhost:8080/api/categories')
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error('Failed to fetch categories:', error);
      });
  };

  const fetchSuppliers = () => {
    fetch('http://localhost:8080/api/suppliers')
      .then((response) => response.json())
      .then((data) => {
        setSuppliers(data);
      })
      .catch((error) => {
        console.error('Failed to fetch suppliers:', error);
      });
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const clearForm = () => {
    setSku('');
    setName('');
    setDescription('');
    setUnitCost('');
    setSellingPrice('');
    setReorderLevel('');
    setCategoryId('');
    setSupplierId('');
    setEditingId(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage('Category name is required.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Category creation failed:', errorText);
        setMessage(`Failed to create category: ${errorText}`);

        return;
      }

      const newCategory: Category = await response.json();

      setCategories((current) => [...current, newCategory]);

      setCategoryId(String(newCategory.id));

      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCategoryForm(false);

      setMessage('Category created successfully.');
    } catch (error) {
      console.error('Category creation failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    const productData = {
      sku,
      name,
      description,
      unitCost: Number(unitCost),
      sellingPrice: Number(sellingPrice),
      reorderLevel: Number(reorderLevel),
      status: 'ACTIVE',
      category: {
        id: Number(categoryId),
      },
      supplier: supplierId
        ? {
            id: Number(supplierId),
          }
        : null,
    };

    try {
      const url = editingId
        ? `http://localhost:8080/api/products/${editingId}`
        : 'http://localhost:8080/api/products';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Backend error:', errorText);
        setMessage(`Failed: ${errorText}`);

        return;
      }

      setMessage(
        editingId
          ? 'Product updated successfully.'
          : 'Product created successfully.',
      );

      clearForm();
      fetchProducts();
    } catch (error) {
      console.error('Request failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);

    setSku(product.sku);
    setName(product.name);
    setDescription(product.description || '');
    setUnitCost(String(product.unitCost));
    setSellingPrice(String(product.sellingPrice));
    setReorderLevel(String(product.reorderLevel));

    setCategoryId(String(product.category.id));

    setSupplierId(product.supplier ? String(product.supplier.id) : '');

    setMessage('');
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Delete failed:', errorText);
        setMessage(`Delete failed: ${errorText}`);

        return;
      }

      setMessage('Product deleted successfully.');

      if (editingId === id) {
        clearForm();
      }

      fetchProducts();
    } catch (error) {
      console.error('Delete request failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  const selectClass =
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>

        <p className="mt-2 text-muted-foreground">
          Manage your products, pricing, categories, and suppliers.
        </p>
      </div>

      {/* Add / Edit Product Form */}
      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Product' : 'Add Product'}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {editingId
                ? 'Update the selected product.'
                : 'Create a new product in your catalog.'}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >
          {/* SKU */}
          <div>
            <label className="text-sm font-medium">SKU</label>

            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className={inputClass}
              placeholder="e.g. CLN-BRU"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Product name"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Optional product description"
              rows={3}
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="text-sm font-medium">Unit Cost</label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className={inputClass}
              placeholder="0.00"
              required
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="text-sm font-medium">Selling Price</label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className={inputClass}
              placeholder="0.00"
              required
            />
          </div>

          {/* Reorder Level */}
          <div>
            <label className="text-sm font-medium">Reorder Level</label>

            <input
              type="number"
              min="0"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className={inputClass}
              placeholder="0"
              required
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Category</label>

              <button
                type="button"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {showCategoryForm ? 'Cancel' : '+ Add Category'}
              </button>
            </div>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {showCategoryForm && (
              <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Category Name
                  </label>

                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Description
                  </label>

                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Add Category
                </button>
              </div>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="text-sm font-medium">Supplier</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={selectClass}
            >
              <option value="">No supplier</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-1 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {editingId ? 'Update Product' : 'Add Product'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && (
          <div className="mt-5 rounded-md border bg-muted/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Product List</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''} in
            catalog
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No products found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add your first product using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-sm font-medium">Cost</th>
                  <th className="px-4 py-3 text-sm font-medium">
                    Selling Price
                  </th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {product.sku}
                    </td>

                    <td className="px-4 py-3 text-sm">{product.name}</td>

                    <td className="px-4 py-3 text-sm">৳{product.unitCost}</td>

                    <td className="px-4 py-3 text-sm">
                      ৳{product.sellingPrice}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {product.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
