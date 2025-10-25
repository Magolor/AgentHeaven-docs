# Minimal makefile for Sphinx documentation

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD  ?= sphinx-build
SOURCEDIR    = source
BUILDDIR     = build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx-Makefile
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# Custom targets
clean:
	@rm -rf $(BUILDDIR)/*

livehtml:
	sphinx-autobuild "$(SOURCEDIR)" "$(BUILDDIR)/html" $(SPHINXOPTS) $(O)

api:
	sphinx-apidoc -f -o "$(SOURCEDIR)/api" ../../src/ahvn \
		--separate --module-first --maxdepth 3
	@echo "Fixing UKF submodule documentation to prevent duplicate warnings..."
	@for ukf_submodule in base experience knowledge; do \
		ukf_file="$(SOURCEDIR)/api/ahvn.ukf.$$ukf_submodule.rst"; \
		if [ -f "$$ukf_file" ]; then \
			if [ "$$(uname)" = "Darwin" ]; then \
				sed -i '' '/^.. automodule:: ahvn\.ukf\.'"$$ukf_submodule"'$$/,/^$$/s/:undoc-members:$$/:undoc-members:\
   :no-index:/' "$$ukf_file"; \
			else \
				sed -i '/^.. automodule:: ahvn\.ukf\.'"$$ukf_submodule"'$$/,/^$$/s/:undoc-members:$$/:undoc-members:\n   :no-index:/' "$$ukf_file"; \
			fi; \
			echo "Added :no-index: to $$ukf_file"; \
		fi; \
	done
